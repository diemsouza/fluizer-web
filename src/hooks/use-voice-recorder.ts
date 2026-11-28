"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setRecordingAudioSession } from "@/src/lib/audio-unlock";
import {
  canResumeAudioContext,
  unlockSharedAudioContext,
} from "@/src/lib/shared-audio-context";
import {
  detectPermissionPlatform,
  pickRecorderMimeType,
  preloadVoiceRemux,
} from "@/src/lib/voice-recording";
import {
  VOICE_AUDIO_CONSTRAINTS,
  VOICE_BITRATE,
  VOICE_IOS_GAIN,
  VOICE_LIMITER_OPTIONS,
  VOICE_MAX_SEC,
  VOICE_MIN_MS,
  VOICE_WARN_SEC,
} from "@/src/lib/constants";

export type VoiceRecorderStatus =
  "idle" | "requesting" | "recording" | "denied";
export type VoiceCaptureError = "not_found" | "in_use" | "generic";

type CaptureGraph = {
  analyser: AnalyserNode;
  recordingStream: MediaStream;
  release: () => void;
};

type UseVoiceRecorderOptions = {
  onRecorded: (recording: Blob) => void;
  onCaptureError: (error: VoiceCaptureError) => void;
};

type UseVoiceRecorderResult = {
  status: VoiceRecorderStatus;
  elapsedMs: number;
  levels: number[];
  isWarning: boolean;
  start: () => void;
  finish: () => void;
  cancel: () => void;
  dismissDenied: () => void;
  resumeAudio: () => void;
};

const TICK_MS = 100;
const LEVEL_TICK_MS = 130;
// Barras suficientes para preencher o composer largo do desktop com espaco
// fixo; as que nao cabem ficam cortadas a esquerda.
const RECORDING_BARS = 120;
// Escala fixa em dB: dividir pelo maior pico fazia o ruido encher as barras, e
// linear com corte zerava o iPhone, que sem cancelamento de eco fica perto de
// 0.001 em silencio e ~0.1 nos picos da fala.
const LEVEL_MIN_DB = -38;
const LEVEL_MAX_DB = -8;
// Espera pelo resume() do AudioContext antes de desistir do ganho: gravar por
// um contexto parado geraria um audio mudo.
const CONTEXT_RESUME_TIMEOUT_MS = 300;
// Rede de seguranca: se o MediaRecorder nunca disparar "stop", a UI nao pode
// ficar presa no estado gravando.
const STOP_FALLBACK_MS = 1500;

const silentLevels = (): number[] =>
  new Array<number>(RECORDING_BARS).fill(0);

function classifyCaptureError(err: unknown): VoiceCaptureError | "denied" {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "not_found";
  }
  if (name === "NotReadableError" || name === "AbortError") return "in_use";
  return "generic";
}

function needsMicGain(): boolean {
  return detectPermissionPlatform().startsWith("ios_");
}

async function waitForRunningContext(ctx: AudioContext): Promise<boolean> {
  if (canResumeAudioContext(ctx.state)) {
    const timeout = new Promise<void>((resolve) =>
      setTimeout(resolve, CONTEXT_RESUME_TIMEOUT_MS),
    );
    try {
      await Promise.race([ctx.resume(), timeout]);
    } catch (err) {
      console.error("[useVoiceRecorder] resume:", err);
    }
  }
  return ctx.state === "running";
}

function createBoost(
  ctx: AudioContext,
  source: AudioNode,
): { output: AudioNode; destination: MediaStreamAudioDestinationNode } {
  const gain = ctx.createGain();
  gain.gain.value = VOICE_IOS_GAIN;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = VOICE_LIMITER_OPTIONS.threshold;
  limiter.knee.value = VOICE_LIMITER_OPTIONS.knee;
  limiter.ratio.value = VOICE_LIMITER_OPTIONS.ratio;
  limiter.attack.value = VOICE_LIMITER_OPTIONS.attack;
  limiter.release.value = VOICE_LIMITER_OPTIONS.release;
  const destination = ctx.createMediaStreamDestination();
  destination.channelCount = 1;
  source.connect(gain);
  gain.connect(limiter);
  limiter.connect(destination);
  return { output: limiter, destination };
}

// O ganho zero ligado ao destino mantem o grafo processando no Safari, que
// nao atualiza um AnalyserNode solto, sem tocar o microfone no alto-falante.
// O medidor le depois do ganho: as barras mostram o que e gravado.
function createCaptureGraph(
  ctx: AudioContext,
  stream: MediaStream,
  withGain: boolean,
): CaptureGraph | null {
  try {
    const source = ctx.createMediaStreamSource(stream);
    const boost = withGain ? createBoost(ctx, source) : null;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    const sink = ctx.createGain();
    sink.gain.value = 0;
    (boost?.output ?? source).connect(analyser);
    analyser.connect(sink);
    sink.connect(ctx.destination);
    const release = (): void => {
      source.disconnect();
      boost?.output.disconnect();
      boost?.destination.stream.getTracks().forEach((track) => track.stop());
      analyser.disconnect();
      sink.disconnect();
    };
    const recordingStream = boost?.destination.stream ?? stream;
    return { analyser, recordingStream, release };
  } catch (err) {
    console.error("[useVoiceRecorder] capture graph:", err);
    return withGain ? createCaptureGraph(ctx, stream, false) : null;
  }
}

function readLevel(
  analyser: AnalyserNode,
  buffer: Float32Array<ArrayBuffer>,
): number {
  analyser.getFloatTimeDomainData(buffer);
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) {
    const value = Math.abs(buffer[i]);
    if (value > peak) peak = value;
  }
  return peak;
}

function scaleLevel(peak: number): number {
  if (peak <= 0) return 0;
  const db = 20 * Math.log10(peak);
  const level = (db - LEVEL_MIN_DB) / (LEVEL_MAX_DB - LEVEL_MIN_DB);
  return Math.min(1, Math.max(0, level));
}

export function useVoiceRecorder({
  onRecorded,
  onCaptureError,
}: UseVoiceRecorderOptions): UseVoiceRecorderResult {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(silentLevels);

  const statusRef = useRef<VoiceRecorderStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const graphRef = useRef<CaptureGraph | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const stoppedAtRef = useRef(0);
  const shouldSendRef = useRef(true);
  const isMountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef({ onRecorded, onCaptureError });
  callbacksRef.current = { onRecorded, onCaptureError };

  const updateStatus = useCallback((next: VoiceRecorderStatus): void => {
    statusRef.current = next;
    if (isMountedRef.current) setStatus(next);
  }, []);

  const releaseCapture = useCallback((): void => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
    graphRef.current?.release();
    graphRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecordingAudioSession(false);
  }, []);

  const deliverRecording = useCallback((): void => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
    fallbackRef.current = null;
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    releaseCapture();
    const durationMs = stoppedAtRef.current - startedAtRef.current;
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
    chunksRef.current = [];
    updateStatus("idle");
    if (!shouldSendRef.current || durationMs < VOICE_MIN_MS) return;
    if (blob.size === 0) return;
    callbacksRef.current.onRecorded(blob);
  }, [releaseCapture, updateStatus]);

  const stopRecording = useCallback(
    (shouldSend: boolean): void => {
      // Soltou antes da captura comecar: nada foi gravado. O then() do
      // getUserMedia ve o status mudado e fecha as tracks.
      if (statusRef.current === "requesting") {
        updateStatus("idle");
        return;
      }
      const recorder = recorderRef.current;
      if (!recorder || stoppedAtRef.current > 0) return;
      shouldSendRef.current = shouldSend;
      stoppedAtRef.current = performance.now();
      if (recorder.state === "inactive") {
        deliverRecording();
        return;
      }
      fallbackRef.current = setTimeout(deliverRecording, STOP_FALLBACK_MS);
      try {
        recorder.stop();
      } catch (err) {
        console.error("[useVoiceRecorder] stop:", err);
        deliverRecording();
      }
    },
    [deliverRecording, updateStatus],
  );

  const finish = useCallback(() => stopRecording(true), [stopRecording]);
  const cancel = useCallback(() => stopRecording(false), [stopRecording]);

  const startTimers = useCallback((): void => {
    const buffer = new Float32Array(1024);
    const clock = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= VOICE_MAX_SEC * 1000) stopRecording(true);
    }, TICK_MS);
    const meter = setInterval(() => {
      const analyser = graphRef.current?.analyser;
      if (!analyser) return;
      const level = scaleLevel(readLevel(analyser, buffer));
      setLevels((prev) => [...prev.slice(1), level]);
    }, LEVEL_TICK_MS);
    timersRef.current = [clock, meter];
  }, [stopRecording]);

  const beginRecording = useCallback(
    (
      stream: MediaStream,
      ctx: AudioContext | null,
      mimeType: string,
      withGain: boolean,
    ): void => {
      streamRef.current = stream;
      // No toque o pointerdown nao conta como gesto e o resume() do clique pode
      // nao ter destravado; com a captura ativa o navegador costuma liberar.
      if (ctx && canResumeAudioContext(ctx.state)) void ctx.resume();
      graphRef.current = ctx ? createCaptureGraph(ctx, stream, withGain) : null;
      const recordingStream = graphRef.current?.recordingStream ?? stream;
      const recorder = new MediaRecorder(recordingStream, {
        mimeType,
        audioBitsPerSecond: VOICE_BITRATE,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      // iOS para o MediaRecorder sozinho ao bloquear a tela ou trocar de app.
      recorder.onstop = () => {
        if (stoppedAtRef.current === 0) {
          stoppedAtRef.current = performance.now();
        }
        deliverRecording();
      };
      recorder.onerror = () => stopRecording(true);
      stream.getTracks().forEach((track) => {
        track.onended = () => stopRecording(true);
      });
      recorderRef.current = recorder;
      stoppedAtRef.current = 0;
      shouldSendRef.current = true;
      recorder.start();
      preloadVoiceRemux(mimeType);
      startedAtRef.current = performance.now();
      setElapsedMs(0);
      setLevels(silentLevels());
      updateStatus("recording");
      startTimers();
    },
    [deliverRecording, stopRecording, startTimers, updateStatus],
  );

  const handleCaptureFailure = useCallback(
    (err: unknown): void => {
      releaseCapture();
      const kind = classifyCaptureError(err);
      if (kind === "denied") {
        updateStatus("denied");
        return;
      }
      console.error("[useVoiceRecorder] capture:", err);
      updateStatus("idle");
      callbacksRef.current.onCaptureError(kind);
    },
    [releaseCapture, updateStatus],
  );

  // iOS: resume do AudioContext e getUserMedia precisam sair sincronos dentro
  // do toque, antes de qualquer await, senao o gesto se perde.
  const start = useCallback((): void => {
    if (statusRef.current !== "idle") return;
    const mimeType = pickRecorderMimeType();
    if (!mimeType) return;
    updateStatus("requesting");
    setRecordingAudioSession(true);
    const ctx = unlockSharedAudioContext();
    navigator.mediaDevices
      .getUserMedia({ audio: VOICE_AUDIO_CONSTRAINTS })
      .then(async (stream) => {
        const withGain =
          ctx !== null && needsMicGain() && (await waitForRunningContext(ctx));
        if (!isMountedRef.current || statusRef.current !== "requesting") {
          stream.getTracks().forEach((track) => track.stop());
          setRecordingAudioSession(false);
          return;
        }
        beginRecording(stream, ctx, mimeType, withGain);
      })
      .catch(handleCaptureFailure);
  }, [beginRecording, handleCaptureFailure, updateStatus]);

  const dismissDenied = useCallback(() => updateStatus("idle"), [updateStatus]);
  const resumeAudio = useCallback((): void => {
    unlockSharedAudioContext();
  }, []);

  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === "hidden") stopRecording(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [stopRecording]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopRecording(false);
      releaseCapture();
    };
  }, [stopRecording, releaseCapture]);

  return {
    status,
    elapsedMs,
    levels,
    isWarning: elapsedMs >= VOICE_WARN_SEC * 1000,
    start,
    finish,
    cancel,
    dismissDenied,
    resumeAudio,
  };
}

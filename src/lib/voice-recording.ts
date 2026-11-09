import {
  type PermissionPlatform,
  resolvePermissionPlatform,
} from "@/src/core/permission-platform";
import { audioExtensionForMime, baseMimeType } from "@/src/core/voice-note";

// Ordem de preferencia: Ogg/Opus direto (Firefox), WebM/Opus remuxado para Ogg
// (Chrome, Android, Safari 18.4+) e AAC em MP4 (Safari 14.1 a 18.3). So
// formatos que o player toca.
const RECORDER_MIME_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/mp4",
];
const VOICE_FILE_NAME = "voice";

export function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (typeof MediaRecorder.isTypeSupported !== "function") return null;
  return (
    RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ??
    null
  );
}

export function canRecordVoice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.mediaDevices?.getUserMedia !== "function") return false;
  return pickRecorderMimeType() !== null;
}

function isWebm(mimeType: string): boolean {
  return baseMimeType(mimeType) === "audio/webm";
}

// A lib de remux so carrega no caminho WebM. Comeca a baixar junto com a
// gravacao para nao atrasar o envio.
export function preloadVoiceRemux(mimeType: string): void {
  if (!isWebm(mimeType)) return;
  import("@/src/lib/webm-to-ogg").catch((err: unknown) =>
    console.error("[preloadVoiceRemux] failed:", err),
  );
}

export async function buildVoiceNoteFile(recording: Blob): Promise<File> {
  const blob = isWebm(recording.type)
    ? await (await import("@/src/lib/webm-to-ogg")).remuxWebmToOgg(recording)
    : recording;
  const type = baseMimeType(blob.type);
  return new File([blob], `${VOICE_FILE_NAME}.${audioExtensionForMime(type)}`, {
    type,
  });
}

export function detectPermissionPlatform(): PermissionPlatform {
  // navigator.standalone so existe no Safari do iOS.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  return resolvePermissionPlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    isStandalone:
      iosStandalone === true ||
      window.matchMedia("(display-mode: standalone)").matches,
  });
}

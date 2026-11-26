import { audioExtensionForMime } from "../core/voice-note";
import type {
  AnswerLanguage,
  DetectedLanguage,
} from "../core/answer-language";

type TranscribeResult = {
  text: string;
  duration: number | null;
  format: string;
  language: DetectedLanguage | null;
  avgLogprob: number | null;
};

type TranscribeOptions = { language?: AnswerLanguage };

type WhisperSegment = { avg_logprob?: number; start?: number; end?: number };

type WhisperResponse = {
  text: string;
  duration?: number;
  language?: string;
  segments?: WhisperSegment[];
};

// verbose_json devolve o idioma por extenso ("english"), nunca o codigo ISO.
const WHISPER_LANGUAGE_NAMES: Record<string, AnswerLanguage> = {
  english: "en",
  portuguese: "pt",
};

// Idioma fora de en/pt vira "other" e nao null: o Whisper as vezes escreve a
// fala curta em outro idioma (ex: coreano) e isso precisa da passada forcada.
function mapWhisperLanguage(language: string | undefined): DetectedLanguage | null {
  if (!language) return null;
  return WHISPER_LANGUAGE_NAMES[language.toLowerCase()] ?? "other";
}

function averageLogprob(segments: WhisperSegment[] | undefined): number | null {
  const scored = (segments ?? []).filter(
    (s): s is Required<WhisperSegment> =>
      typeof s.avg_logprob === "number" &&
      typeof s.start === "number" &&
      typeof s.end === "number",
  );
  const totalDuration = scored.reduce((sum, s) => sum + (s.end - s.start), 0);
  if (totalDuration <= 0) return null;
  const weighted = scored.reduce(
    (sum, s) => sum + s.avg_logprob * (s.end - s.start),
    0,
  );
  return weighted / totalDuration;
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  options: TranscribeOptions = {},
): Promise<TranscribeResult> {
  const ext = audioExtensionForMime(mimeType);
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  if (options.language) formData.append("language", options.language);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Whisper API error ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as WhisperResponse;
  return {
    text: data.text,
    duration: data.duration ?? null,
    format: ext,
    language: mapWhisperLanguage(data.language),
    avgLogprob: averageLogprob(data.segments),
  };
}

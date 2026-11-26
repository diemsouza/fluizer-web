import {
  VOICE_ACCEPTED_CONTENT_TYPES,
  VOICE_MAX_BYTES,
  VOICE_MIN_MS,
} from "../lib/constants";

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/opus": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "m4a",
  "audio/mpeg": "mp3",
  "audio/webm": "webm",
};

export function baseMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

export function audioExtensionForMime(mimeType: string): string {
  const base = baseMimeType(mimeType);
  return AUDIO_EXTENSION_BY_MIME[base] ?? base.split("/")[1] ?? "ogg";
}

// Construtor em vez de literal: o target do tsconfig (es5) nao aceita a flag u.
const LETTER_PATTERN = new RegExp("\\p{L}", "u");
// Grego, cirilico, arabe, hebraico, CJK e hangul. Em fala curta o Whisper as
// vezes escreve a resposta em outro alfabeto (ex: "Nice to meet you" em
// coreano); a resposta esperada e sempre em ingles ou portugues.
const NON_LATIN_PATTERN = new RegExp(
  "[\\u0370-\\u1CFF\\u3000-\\u9FFF\\uAC00-\\uD7AF]",
);
// Frases que o Whisper inventa em audio silencioso ou ruido, vindas das
// legendas usadas no treino.
const WHISPER_HALLUCINATIONS = [
  "legendas pela comunidade",
  "amara.org",
  "obrigado por assistir",
  "obrigada por assistir",
  "thanks for watching",
  "thank you for watching",
  "subtitles by",
];

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isWhisperHallucination(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return WHISPER_HALLUCINATIONS.some((phrase) => normalized.includes(phrase));
}

// Transcricao que nao pode ir para a avaliacao: silencio ou ruido (sem letra),
// outro alfabeto ou alucinacao conhecida. A pergunta segue pendente.
export function isUnusableTranscription(text: string): boolean {
  return (
    !LETTER_PATTERN.test(text) ||
    NON_LATIN_PATTERN.test(text) ||
    isWhisperHallucination(text)
  );
}

// Duracao ilegivel (null) segue para a transcricao.
export function isVoiceNoteTooShort(durationSec: number | null): boolean {
  return durationSec !== null && durationSec * 1000 < VOICE_MIN_MS;
}

export function isAcceptedVoiceNote(
  mimeType: string,
  sizeBytes: number,
): boolean {
  return (
    VOICE_ACCEPTED_CONTENT_TYPES.includes(baseMimeType(mimeType)) &&
    sizeBytes > 0 &&
    sizeBytes <= VOICE_MAX_BYTES
  );
}

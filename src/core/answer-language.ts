import type { QuestionFormat } from "../lib/prisma";
import {
  ANSWER_LANGUAGE_BY_FORMAT,
  ANSWER_LANGUAGE_MAX_BLOCKS,
  VOICE_LANGUAGE_LOGPROB_MARGIN,
  VOICE_LANGUAGE_MIN_WORDS,
} from "../lib/constants";

export type AnswerLanguage = "en" | "pt";

export type VoicePass = {
  text: string;
  language: AnswerLanguage | null;
  avgLogprob: number | null;
};

export type VoiceLanguageResult = {
  text: string;
  language: AnswerLanguage | null;
  isMismatch: boolean;
};

export function getExpectedAnswerLanguage(
  format: QuestionFormat | null,
): AnswerLanguage | null {
  return format ? ANSWER_LANGUAGE_BY_FORMAT[format] : null;
}

export function needsForcedVoicePass(
  detected: AnswerLanguage | null,
  expected: AnswerLanguage | null,
): boolean {
  return !!expected && !!detected && detected !== expected;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[a-zà-ÿ]/i.test(w)).length;
}

// Com sotaque, o Whisper pode detectar portugues e devolver a fala em ingles
// ja traduzida. A passada forcada no idioma esperado desfaz isso: se ela soa
// tao provavel quanto a automatica, o aluno falou o idioma esperado.
export function resolveVoiceLanguage(
  auto: VoicePass,
  forced: VoicePass | null,
  expected: AnswerLanguage,
): VoiceLanguageResult {
  if (!forced || auto.avgLogprob === null || forced.avgLogprob === null) {
    return { text: auto.text, language: auto.language, isMismatch: false };
  }
  if (forced.avgLogprob >= auto.avgLogprob - VOICE_LANGUAGE_LOGPROB_MARGIN) {
    return { text: forced.text, language: expected, isMismatch: false };
  }
  return {
    text: auto.text,
    language: auto.language,
    isMismatch: countWords(auto.text) >= VOICE_LANGUAGE_MIN_WORDS,
  };
}

export function isAnswerLanguageMismatch(
  answerLanguage: string | null | undefined,
  expected: AnswerLanguage | null,
): boolean {
  return (
    !!expected &&
    (answerLanguage === "en" || answerLanguage === "pt") &&
    answerLanguage !== expected
  );
}

export function readLanguageBlockCount(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") return 0;
  const count = (metadata as Record<string, unknown>).languageBlockCount;
  return typeof count === "number" ? count : 0;
}

export function canBlockAnswerLanguage(metadata: unknown): boolean {
  return readLanguageBlockCount(metadata) < ANSWER_LANGUAGE_MAX_BLOCKS;
}

export function incrementLanguageBlockCount(
  metadata: unknown,
): Record<string, unknown> {
  const current =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};
  return { ...current, languageBlockCount: readLanguageBlockCount(metadata) + 1 };
}

// O teto vale por tentativa: depois de avaliada, a pergunta volta na revisao
// com o contador zerado.
export function clearLanguageBlockCount<T extends object>(
  metadata: T,
): Omit<T, "languageBlockCount"> {
  const { languageBlockCount: _ignored, ...rest } = metadata as T & {
    languageBlockCount?: number;
  };
  return rest;
}

import { describe, expect, it, vi } from "vitest";
import {
  canBlockAnswerLanguage,
  clearLanguageBlockCount,
  getExpectedAnswerLanguage,
  incrementLanguageBlockCount,
  isAnswerLanguageMismatch,
  needsForcedVoicePass,
  resolveVoiceLanguage,
} from "./answer-language";

vi.mock("../lib/prisma", async () => import("../../prisma/generated/enums"));

describe("getExpectedAnswerLanguage", () => {
  it("tradução espera português, o resto inglês, opções ficam fora", () => {
    expect(getExpectedAnswerLanguage("recall_inverted")).toBe("pt");
    expect(getExpectedAnswerLanguage("audio_translation")).toBe("pt");
    expect(getExpectedAnswerLanguage("recall")).toBe("en");
    expect(getExpectedAnswerLanguage("image_transcription")).toBe("en");
    expect(getExpectedAnswerLanguage("choice")).toBeNull();
    expect(getExpectedAnswerLanguage(null)).toBeNull();
  });
});

describe("needsForcedVoicePass", () => {
  it("só com idioma detectado diferente do esperado", () => {
    expect(needsForcedVoicePass("pt", "en")).toBe(true);
    expect(needsForcedVoicePass("en", "en")).toBe(false);
    expect(needsForcedVoicePass(null, "en")).toBe(false);
    expect(needsForcedVoicePass("pt", null)).toBe(false);
  });
});

describe("resolveVoiceLanguage", () => {
  const auto = {
    text: "A cena mostra uma pessoa olhando para o prédio",
    language: "pt" as const,
    avgLogprob: -0.3,
  };

  it("passada forçada plausível: detecção errada, usa o texto em inglês", () => {
    const forced = {
      text: "The scene shows a person looking at the building",
      language: "en" as const,
      avgLogprob: -0.4,
    };
    expect(resolveVoiceLanguage(auto, forced, "en")).toEqual({
      text: forced.text,
      language: "en",
      isMismatch: false,
    });
  });

  it("passada forçada muito pior: descompasso real", () => {
    const forced = { text: "The scene", language: "en" as const, avgLogprob: -1.2 };
    expect(resolveVoiceLanguage(auto, forced, "en").isMismatch).toBe(true);
  });

  it("resposta curta nunca bloqueia", () => {
    const short = { text: "sim", language: "pt" as const, avgLogprob: -0.2 };
    const forced = { text: "yes", language: "en" as const, avgLogprob: -1.5 };
    expect(resolveVoiceLanguage(short, forced, "en").isMismatch).toBe(false);
  });

  it("sem segunda passada segue sem bloquear", () => {
    expect(resolveVoiceLanguage(auto, null, "en").isMismatch).toBe(false);
  });
});

describe("isAnswerLanguageMismatch", () => {
  it("unclear ou sem idioma esperado nunca bloqueia", () => {
    expect(isAnswerLanguageMismatch("pt", "en")).toBe(true);
    expect(isAnswerLanguageMismatch("en", "pt")).toBe(true);
    expect(isAnswerLanguageMismatch("unclear", "en")).toBe(false);
    expect(isAnswerLanguageMismatch("pt", null)).toBe(false);
    expect(isAnswerLanguageMismatch(undefined, "en")).toBe(false);
  });
});

describe("contador de bloqueios", () => {
  it("bloqueia duas vezes e libera a terceira", () => {
    const first = incrementLanguageBlockCount(null);
    expect(canBlockAnswerLanguage(first)).toBe(true);
    const second = incrementLanguageBlockCount(first);
    expect(canBlockAnswerLanguage(second)).toBe(false);
  });

  it("zera depois da avaliação mantendo o resto", () => {
    expect(clearLanguageBlockCount({ languageBlockCount: 2, rightCount: 1 })).toEqual({
      rightCount: 1,
    });
  });
});

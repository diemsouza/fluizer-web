import { describe, expect, it } from "vitest";
import {
  audioExtensionForMime,
  baseMimeType,
  isAcceptedVoiceNote,
  isUnusableTranscription,
  isVoiceNoteTooShort,
} from "./voice-note";

describe("audioExtensionForMime", () => {
  it("mapeia AAC em MP4 para m4a", () => {
    expect(audioExtensionForMime("audio/mp4")).toBe("m4a");
    expect(audioExtensionForMime("audio/x-m4a")).toBe("m4a");
  });

  it("ignora parametros de codec", () => {
    expect(audioExtensionForMime("audio/ogg; codecs=opus")).toBe("ogg");
    expect(audioExtensionForMime("audio/webm;codecs=opus")).toBe("webm");
  });

  it("cai no subtipo quando nao conhece o MIME", () => {
    expect(audioExtensionForMime("audio/wav")).toBe("wav");
  });
});

describe("baseMimeType", () => {
  it("tira parametros e normaliza caixa", () => {
    expect(baseMimeType("Audio/OGG; codecs=opus")).toBe("audio/ogg");
  });
});

describe("isUnusableTranscription", () => {
  it("vazia ou so pontuacao e inaudivel", () => {
    expect(isUnusableTranscription("")).toBe(true);
    expect(isUnusableTranscription("  ...  ")).toBe(true);
    expect(isUnusableTranscription("♪ ♪")).toBe(true);
  });

  it("qualquer letra conta como resposta", () => {
    expect(isUnusableTranscription("I")).toBe(false);
    expect(isUnusableTranscription("é")).toBe(false);
    expect(isUnusableTranscription("Nice to meet you.")).toBe(false);
    expect(isUnusableTranscription("Prazer em conhecer você")).toBe(false);
  });

  it("outro alfabeto nunca vai para a avaliação", () => {
    expect(isUnusableTranscription("만나서 반가워요!")).toBe(true);
    expect(isUnusableTranscription("Приятно познакомиться")).toBe(true);
    expect(isUnusableTranscription("はじめまして")).toBe(true);
    expect(isUnusableTranscription("Χάρηκα")).toBe(true);
  });

  it("alucinações do Whisper em silêncio", () => {
    expect(isUnusableTranscription("Legendas pela comunidade Amara.org")).toBe(true);
    expect(isUnusableTranscription("Obrigado por assistir!")).toBe(true);
    expect(isUnusableTranscription("Thanks for watching!")).toBe(true);
  });
});

describe("isVoiceNoteTooShort", () => {
  it("abaixo do mínimo é curto, duração ilegível segue", () => {
    expect(isVoiceNoteTooShort(0.6)).toBe(true);
    expect(isVoiceNoteTooShort(2.41)).toBe(false);
    expect(isVoiceNoteTooShort(null)).toBe(false);
  });
});

describe("isAcceptedVoiceNote", () => {
  it("aceita Ogg e MP4 dentro do limite", () => {
    expect(isAcceptedVoiceNote("audio/ogg;codecs=opus", 50_000)).toBe(true);
    expect(isAcceptedVoiceNote("audio/mp4", 200_000)).toBe(true);
  });

  it("recusa WebM, arquivo vazio e acima do limite", () => {
    expect(isAcceptedVoiceNote("audio/webm", 50_000)).toBe(false);
    expect(isAcceptedVoiceNote("audio/ogg", 0)).toBe(false);
    expect(isAcceptedVoiceNote("audio/ogg", 5 * 1024 * 1024)).toBe(false);
  });
});

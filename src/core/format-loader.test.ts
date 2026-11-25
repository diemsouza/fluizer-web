import { describe, expect, it, vi } from "vitest";
import { QuestionFormat } from "../lib/prisma";
import { SectionQuestionResult } from "../lib/llm-schemas";
import { validateGeneratedQuestion } from "./format-loader";

function buildQuestion(
  overrides: Partial<SectionQuestionResult>,
): SectionQuestionResult {
  return {
    question: "",
    answerKeys: ["waiting"],
    questionFormat: QuestionFormat.recall,
    questionOptions: [],
    term: "I am waiting for an answer",
    termHint: null,
    meaning: "eu estou esperando uma resposta",
    sourceContent: null,
    warning: null,
    imageable: null,
    imageableReason: null,
    questionImageDescription: null,
    questionAudioText: null,
    ...overrides,
  };
}

describe("validateGeneratedQuestion enunciado vazio", () => {
  it("rejeita enunciado vazio em formato de texto", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = validateGeneratedQuestion(buildQuestion({}));
    expect(result).toContain("sem enunciado");
  });

  it("aceita enunciado vazio nos formatos de imagem e áudio", () => {
    const formats = [
      QuestionFormat.image_recognition,
      QuestionFormat.image_transcription,
      QuestionFormat.audio_transcription,
      QuestionFormat.audio_translation,
    ];
    for (const questionFormat of formats) {
      const result = validateGeneratedQuestion(
        buildQuestion({ questionFormat }),
      );
      expect(result).toBeUndefined();
    }
  });
});

describe("validateGeneratedQuestion parêntese no fim do cenário", () => {
  const scenario = (question: string): SectionQuestionResult =>
    buildQuestion({
      question,
      questionFormat: QuestionFormat.scenario,
      answerKeys: ["I need access"],
      term: "I need access",
    });

  it("rejeita texto depois do parêntese", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = validateGeneratedQuestion(
      scenario(
        "O sistema bloqueou você; diga (eu preciso de acesso) ao suporte.",
      ),
    );
    expect(result).toContain("texto depois do parêntese");
  });

  it("aceita parêntese no fim, com ou sem pontuação", () => {
    const questions = [
      "O sistema bloqueou você e você fala com o suporte: (eu preciso de acesso)",
      "Você explica por que não vai à festa: (não vou, a menos que você vá comigo).",
      "Estava chovendo muito, mas você saiu (de qualquer forma).",
    ];
    for (const question of questions) {
      expect(validateGeneratedQuestion(scenario(question))).toBeUndefined();
    }
  });

  it("não se aplica a outros formatos", () => {
    const result = validateGeneratedQuestion(
      buildQuestion({
        question: "Como se diz (esperando) em inglês?",
        questionFormat: QuestionFormat.recall,
      }),
    );
    expect(result).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import {
  buildAnsweredInteractive,
  parseMessage,
  resolveSelectedButtonId,
} from "./parser";

const buttons = [
  { id: "choice_option_1", label: "Mesa" },
  { id: "choice_option_2", label: "Cadeira" },
  { id: "choice_option_3", label: "Fogão" },
];

describe("resolveSelectedButtonId", () => {
  it("usa o buttonId quando ele existe entre os botões", () => {
    expect(resolveSelectedButtonId(buttons, "choice_option_2", "Mesa")).toBe(
      "choice_option_2",
    );
  });

  it("buttonId inexistente cai para o número digitado", () => {
    expect(resolveSelectedButtonId(buttons, "outro_1", "3")).toBe(
      "choice_option_3",
    );
  });

  it("resolve pelo número", () => {
    expect(resolveSelectedButtonId(buttons, undefined, " 1 ")).toBe(
      "choice_option_1",
    );
  });

  it("resolve pelo texto ignorando acento e caixa", () => {
    expect(resolveSelectedButtonId(buttons, undefined, "fogao")).toBe(
      "choice_option_3",
    );
  });

  it("sem correspondência devolve null", () => {
    expect(resolveSelectedButtonId(buttons, undefined, "sofá")).toBeNull();
    expect(resolveSelectedButtonId(buttons, undefined, "7")).toBeNull();
  });
});

describe("buildAnsweredInteractive", () => {
  const interactive = { body: "Qual?", buttons, isOptionList: true };

  it("marca disabled e selectedId", () => {
    expect(buildAnsweredInteractive(interactive, "choice_option_1")).toEqual({
      ...interactive,
      disabled: true,
      selectedId: "choice_option_1",
    });
  });

  it("sem seleção grava só disabled", () => {
    expect(buildAnsweredInteractive(interactive, null)).toEqual({
      ...interactive,
      disabled: true,
    });
  });
});

describe("parseMessage", () => {
  it("texto com barra que não é comando vira unknown_command", () => {
    expect(parseMessage("/praticr").intent).toBe("unknown_command");
    expect(parseMessage("/nivel basico").intent).toBe("unknown_command");
  });

  it("comando certo segue reconhecido", () => {
    expect(parseMessage("/praticar").intent).toBe("practice_now");
    expect(parseMessage("/pausar 2").intent).toBe("pause_activity");
  });

  it("barra no meio do texto segue texto comum", () => {
    expect(parseMessage("and/or").intent).toBe("free_text");
    expect(parseMessage("praticar").intent).toBe("free_text");
  });
});

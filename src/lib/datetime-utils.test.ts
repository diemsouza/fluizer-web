import { describe, expect, it } from "vitest";
import { startOfUserDay } from "./datetime-utils";

describe("startOfUserDay", () => {
  it("22h em Brasília ainda é o mesmo dia, mesmo já sendo amanhã em UTC", () => {
    const now = new Date("2026-11-28T01:00:00.000Z");
    expect(startOfUserDay(now, "America/Sao_Paulo").toISOString()).toBe(
      "2026-11-27T00:00:00.000Z",
    );
  });

  it("vira o dia na meia-noite local", () => {
    const now = new Date("2026-11-28T03:00:00.000Z");
    expect(startOfUserDay(now, "America/Sao_Paulo").toISOString()).toBe(
      "2026-11-28T00:00:00.000Z",
    );
  });

  it("fuso adiantado já está no dia seguinte", () => {
    const now = new Date("2026-11-27T20:00:00.000Z");
    expect(startOfUserDay(now, "Asia/Tokyo").toISOString()).toBe(
      "2026-11-28T00:00:00.000Z",
    );
  });
});

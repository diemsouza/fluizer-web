import { describe, expect, it } from "vitest";
import { isValidTimeZone } from "./timezone";

describe("isValidTimeZone", () => {
  it("aceita nome IANA canônico", () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("aceita alias que o navegador pode mandar", () => {
    expect(isValidTimeZone("Asia/Calcutta")).toBe(true);
  });

  it("recusa nome inexistente", () => {
    expect(isValidTimeZone("America/Nowhere")).toBe(false);
    expect(isValidTimeZone("abc")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("recusa offset solto", () => {
    expect(isValidTimeZone("+03:00")).toBe(false);
    expect(isValidTimeZone("-0300")).toBe(false);
  });
});

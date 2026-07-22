import { describe, it, expect } from "vitest";
import { validateInput, MIN_INPUT_LENGTH, MAX_INPUT_LENGTH } from "./types";

const ok = "a".repeat(MIN_INPUT_LENGTH);

describe("validateInput", () => {
  it("accepts and trims two sufficiently long inputs", () => {
    const result = validateInput(`  ${ok}  `, `\n${ok}\n`);
    expect(result).toEqual({ ok: true, value: { resume: ok, jobDescription: ok } });
  });

  it("rejects a too-short resume, naming the field", () => {
    const result = validateInput("too short", ok);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Resume needs at least/);
  });

  it("rejects a too-short job description, naming the field", () => {
    const result = validateInput(ok, "nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Job description needs at least/);
  });

  it("counts only trimmed length toward the minimum", () => {
    const padded = "b".repeat(MIN_INPUT_LENGTH - 1) + "   ";
    const result = validateInput(padded, ok);
    expect(result.ok).toBe(false);
  });

  it("rejects inputs over the maximum length", () => {
    const tooLong = "c".repeat(MAX_INPUT_LENGTH + 1);
    const result = validateInput(tooLong, ok);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/must be under/);
  });

  it("rejects non-string inputs", () => {
    expect(validateInput(undefined, ok).ok).toBe(false);
    expect(validateInput(ok, 123).ok).toBe(false);
  });
});

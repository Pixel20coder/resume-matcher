import { describe, it, expect } from "vitest";
import { parseSession, serializeSession, type SavedSession } from "./storage";
import type { AnalysisResult } from "./types";

const result: AnalysisResult = {
  score: 77,
  summary: "Good overlap.",
  matchedSkills: ["TypeScript"],
  missingSkills: ["Go"],
  suggestions: ["Shipped a Next.js app used by 1k users."],
};

const session: SavedSession = {
  resume: "a".repeat(60),
  jobDescription: "b".repeat(60),
  result,
};

describe("serializeSession / parseSession round trip", () => {
  it("restores an identical session", () => {
    expect(parseSession(serializeSession(session))).toEqual(session);
  });
});

describe("parseSession", () => {
  it("returns null for null or empty input", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseSession("{not json")).toBeNull();
  });

  it("returns null when fields are missing or wrong type", () => {
    expect(parseSession(JSON.stringify({ resume: 1, jobDescription: "x", result }))).toBeNull();
    expect(parseSession(JSON.stringify({ resume: "x", jobDescription: "y" }))).toBeNull();
    expect(parseSession(JSON.stringify({ resume: "x", jobDescription: "y", result: null }))).toBeNull();
  });

  it("normalizes a partial result through parseAnalysis", () => {
    const raw = JSON.stringify({
      resume: "x",
      jobDescription: "y",
      result: { score: 250, summary: "ok" },
    });
    const parsed = parseSession(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.result.score).toBe(100); // clamped
    expect(parsed!.result.matchedSkills).toEqual([]); // defaulted
    expect(parsed!.result.suggestions).toEqual([]);
  });
});

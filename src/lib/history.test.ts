import { describe, it, expect } from "vitest";
import {
  addEntry,
  entryLabel,
  parseHistory,
  serializeHistory,
  MAX_HISTORY,
  type HistoryEntry,
} from "./history";
import type { AnalysisResult } from "./types";

const result = (score: number): AnalysisResult => ({
  score,
  summary: "",
  categories: [],
  matchedSkills: [],
  missingSkills: [],
  suggestions: [],
});

const entry = (id: string, job: string, score = 50): HistoryEntry => ({
  id,
  savedAt: 1,
  resume: "resume text",
  jobDescription: job,
  result: result(score),
});

describe("addEntry", () => {
  it("prepends the newest entry", () => {
    const list = addEntry([entry("a", "Job A")], entry("b", "Job B"));
    expect(list.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("replaces an earlier entry with the same inputs", () => {
    const first = addEntry([], entry("a", "Same job", 40));
    const second = addEntry(first, entry("b", "Same job", 90));
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe("b");
    expect(second[0].result.score).toBe(90);
  });

  it("caps the list length", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < MAX_HISTORY + 3; i++) {
      list = addEntry(list, entry(`id-${i}`, `Job ${i}`));
    }
    expect(list).toHaveLength(MAX_HISTORY);
    expect(list[0].id).toBe(`id-${MAX_HISTORY + 2}`); // newest kept
  });
});

describe("entryLabel", () => {
  it("uses the first non-empty line and the score", () => {
    expect(entryLabel(entry("a", "\n\n  Senior Engineer  \nrest", 82))).toBe(
      "Senior Engineer · 82/100",
    );
  });

  it("truncates a long title with an ellipsis", () => {
    const label = entryLabel(entry("a", "x".repeat(80), 70));
    expect(label.startsWith("x".repeat(47) + "…")).toBe(true);
    expect(label.endsWith("· 70/100")).toBe(true);
  });

  it("falls back when the job description is blank", () => {
    expect(entryLabel(entry("a", "   ", 10))).toBe("Untitled role · 10/100");
  });
});

describe("serializeHistory / parseHistory", () => {
  it("round trips a list", () => {
    const list = [entry("a", "Job A", 60), entry("b", "Job B", 70)];
    expect(parseHistory(serializeHistory(list))).toEqual(list);
  });

  it("returns [] for missing or invalid input", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("not json")).toEqual([]);
    expect(parseHistory('{"not":"an array"}')).toEqual([]);
  });

  it("drops malformed entries but keeps valid ones", () => {
    const raw = JSON.stringify([
      entry("a", "Good", 55),
      { id: "b", savedAt: "nope", resume: "x", jobDescription: "y", result: result(1) },
      { id: "c" },
    ]);
    const parsed = parseHistory(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("a");
  });
});

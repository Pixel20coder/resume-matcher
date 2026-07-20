import { describe, it, expect } from "vitest";
import { buildMessages, extractJson, parseAnalysis } from "./analyze";

describe("extractJson", () => {
  it("parses a bare JSON object", () => {
    expect(extractJson('{"score":80}')).toEqual({ score: 80 });
  });

  it("strips code fences and surrounding prose", () => {
    const raw = 'Sure!\n```json\n{"score":72,"summary":"ok"}\n```\nHope this helps';
    expect(extractJson(raw)).toEqual({ score: 72, summary: "ok" });
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow(/No JSON object/);
  });
});

describe("parseAnalysis", () => {
  it("normalizes a well-formed object", () => {
    const result = parseAnalysis({
      score: 83,
      summary: "Strong fit.",
      matchedSkills: ["React", "TypeScript"],
      missingSkills: ["Go"],
      suggestions: ["Led a migration to TypeScript."],
    });
    expect(result).toEqual({
      score: 83,
      summary: "Strong fit.",
      matchedSkills: ["React", "TypeScript"],
      missingSkills: ["Go"],
      suggestions: ["Led a migration to TypeScript."],
    });
  });

  it("clamps the score to 0–100 and rounds it", () => {
    expect(parseAnalysis({ score: 142 }).score).toBe(100);
    expect(parseAnalysis({ score: -5 }).score).toBe(0);
    expect(parseAnalysis({ score: 66.7 }).score).toBe(67);
  });

  it("coerces a numeric-string score", () => {
    expect(parseAnalysis({ score: "88" }).score).toBe(88);
  });

  it("defaults a missing or invalid score to 0", () => {
    expect(parseAnalysis({}).score).toBe(0);
    expect(parseAnalysis({ score: "high" }).score).toBe(0);
  });

  it("drops non-string entries from skill and suggestion arrays", () => {
    const result = parseAnalysis({
      matchedSkills: ["React", 42, null],
      missingSkills: "not an array",
      suggestions: ["Good bullet", {}],
    });
    expect(result.matchedSkills).toEqual(["React"]);
    expect(result.missingSkills).toEqual([]);
    expect(result.suggestions).toEqual(["Good bullet"]);
  });

  it("rejects non-object input", () => {
    expect(() => parseAnalysis(null)).toThrow(/not an object/);
    expect(() => parseAnalysis("nope")).toThrow(/not an object/);
  });
});

describe("buildMessages", () => {
  it("builds a system and user message containing both inputs", () => {
    const messages = buildMessages("my resume text", "the job description");
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain("my resume text");
    expect(messages[1].content).toContain("the job description");
  });
});

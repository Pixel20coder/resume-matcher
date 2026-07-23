import { describe, it, expect } from "vitest";
import { buildReport, reportFilename, scoreVerdict } from "./report";
import type { AnalysisResult } from "./types";

const base: AnalysisResult = {
  score: 82,
  summary: "Solid overlap with the core stack.",
  matchedSkills: ["TypeScript", "React"],
  missingSkills: ["Kubernetes"],
  suggestions: ["Led migration to React 19, cutting bundle size 30%."],
};

describe("scoreVerdict", () => {
  it("labels by threshold", () => {
    expect(scoreVerdict(90)).toBe("Strong match");
    expect(scoreVerdict(75)).toBe("Strong match");
    expect(scoreVerdict(60)).toBe("Partial match");
    expect(scoreVerdict(49)).toBe("Weak match");
    expect(scoreVerdict(0)).toBe("Weak match");
  });
});

describe("buildReport", () => {
  it("includes score, verdict, and summary", () => {
    const md = buildReport(base);
    expect(md).toContain("# Resume match report");
    expect(md).toContain("**Match score:** 82/100 — Strong match");
    expect(md).toContain("Solid overlap with the core stack.");
  });

  it("renders each skill and suggestion as a bullet", () => {
    const md = buildReport(base);
    expect(md).toContain("## Matched skills (2)");
    expect(md).toContain("- TypeScript");
    expect(md).toContain("- React");
    expect(md).toContain("## Missing skills (1)");
    expect(md).toContain("- Kubernetes");
    expect(md).toContain("- Led migration to React 19, cutting bundle size 30%.");
  });

  it("shows placeholders when lists are empty", () => {
    const md = buildReport({
      score: 30,
      summary: "",
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
    });
    expect(md).toContain("Weak match");
    expect(md).toContain("_No summary provided._");
    expect(md).toContain("_No overlapping skills detected._");
    expect(md).toContain("_Nothing major missing._");
    expect(md).toContain("_No suggestions provided._");
  });

  it("ends with a trailing newline", () => {
    expect(buildReport(base).endsWith("\n")).toBe(true);
  });
});

describe("reportFilename", () => {
  it("embeds the score", () => {
    expect(reportFilename(82)).toBe("resume-match-report-82.md");
  });
});

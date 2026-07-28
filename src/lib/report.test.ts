import { describe, it, expect } from "vitest";
import { buildReport, reportFilename, scoreVerdict, suggestionsToText } from "./report";
import type { AnalysisResult } from "./types";

const base: AnalysisResult = {
  score: 82,
  summary: "Solid overlap with the core stack.",
  categories: [],
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

  it("includes a score breakdown section when categories are present", () => {
    const md = buildReport({ ...base, categories: [{ name: "Skills", score: 90 }] });
    expect(md).toContain("## Score breakdown");
    expect(md).toContain("- Skills: 90/100");
  });

  it("omits the breakdown section when there are no categories", () => {
    expect(buildReport(base)).not.toContain("## Score breakdown");
  });

  it("shows placeholders when lists are empty", () => {
    const md = buildReport({
      score: 30,
      summary: "",
      categories: [],
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

describe("suggestionsToText", () => {
  it("renders one dash-prefixed bullet per line", () => {
    expect(suggestionsToText(["First bullet", "Second bullet"])).toBe(
      "- First bullet\n- Second bullet",
    );
  });

  it("trims whitespace and drops blank entries", () => {
    expect(suggestionsToText(["  Kept  ", "   ", ""])).toBe("- Kept");
  });

  it("returns an empty string for no suggestions", () => {
    expect(suggestionsToText([])).toBe("");
  });
});

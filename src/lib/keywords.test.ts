import { describe, it, expect } from "vitest";
import {
  tokenize,
  extractKeywords,
  keywordCoverage,
  coverageScore,
} from "./keywords";

describe("tokenize", () => {
  it("lowercases and splits on non-word characters", () => {
    expect(tokenize("React, Node.js and TypeScript!")).toEqual([
      "react",
      "node.js",
      "and",
      "typescript",
    ]);
  });

  it("keeps tech tokens with + and #", () => {
    expect(tokenize("C++ and C# devs")).toEqual(["c++", "and", "c#", "devs"]);
  });

  it("returns an empty array for blank input", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("extractKeywords", () => {
  it("counts meaningful terms and sorts by frequency", () => {
    const jd = "Kubernetes Kubernetes Docker Docker Docker Python";
    expect(extractKeywords(jd)).toEqual([
      { term: "docker", count: 3 },
      { term: "kubernetes", count: 2 },
      { term: "python", count: 1 },
    ]);
  });

  it("drops stopwords, short tokens, and pure numbers", () => {
    const terms = extractKeywords("You will have 5 years with Go and AI").map((k) => k.term);
    expect(terms).not.toContain("you");
    expect(terms).not.toContain("with");
    expect(terms).not.toContain("5");
    expect(terms).toContain("go");
    expect(terms).toContain("ai");
  });

  it("breaks frequency ties alphabetically and respects the limit", () => {
    const jd = "alpha beta gamma delta";
    expect(extractKeywords(jd, 2)).toEqual([
      { term: "alpha", count: 1 },
      { term: "beta", count: 1 },
    ]);
  });
});

describe("keywordCoverage", () => {
  it("splits keywords into covered and missing by resume tokens", () => {
    const keywords = extractKeywords("Docker Kubernetes Python Rust");
    const { covered, missing } = keywordCoverage("I use Docker and Python daily", keywords);
    expect(covered.map((k) => k.term).sort()).toEqual(["docker", "python"]);
    expect(missing.map((k) => k.term).sort()).toEqual(["kubernetes", "rust"]);
  });

  it("matches whole tokens, not substrings", () => {
    const { covered } = keywordCoverage("javascripting", [{ term: "java", count: 1 }]);
    expect(covered).toEqual([]);
  });
});

describe("coverageScore", () => {
  it("returns a rounded percentage", () => {
    expect(coverageScore(3, 4)).toBe(75);
    expect(coverageScore(1, 3)).toBe(33);
  });

  it("is 0 when there are no keywords", () => {
    expect(coverageScore(0, 0)).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import {
  countMentions,
  priorityFor,
  rankMissingSkills,
  HIGH_PRIORITY_MENTIONS,
} from "./priority";

describe("countMentions", () => {
  it("counts a skill regardless of case or trailing punctuation", () => {
    expect(countMentions("React", "react, React and REACT.")).toBe(3);
  });

  it("matches multi-word skills only as a full phrase", () => {
    const text = "machine learning matters; learning machine parts does not";
    expect(countMentions("machine learning", text)).toBe(1);
  });

  it("does not match a skill inside a longer word", () => {
    expect(countMentions("go", "goland is not golang")).toBe(0);
  });

  it("keeps punctuated tech terms intact", () => {
    expect(countMentions("Node.js", "Node.js backend work in Node.js")).toBe(2);
    expect(countMentions("C++", "C++ and C++ again")).toBe(2);
  });

  it("returns 0 for a blank skill or an empty text", () => {
    expect(countMentions("   ", "anything at all")).toBe(0);
    expect(countMentions("Rust", "")).toBe(0);
  });
});

describe("priorityFor", () => {
  it("bands counts into high, medium, and low", () => {
    expect(priorityFor(HIGH_PRIORITY_MENTIONS)).toBe("high");
    expect(priorityFor(HIGH_PRIORITY_MENTIONS + 5)).toBe("high");
    expect(priorityFor(1)).toBe("medium");
    expect(priorityFor(0)).toBe("low");
  });
});

describe("rankMissingSkills", () => {
  const job = "Kubernetes, Kubernetes, Kubernetes. Also Terraform. We like tidy infra.";

  it("orders skills by mention count, most-wanted first", () => {
    const ranked = rankMissingSkills(["Terraform", "Kubernetes", "Elixir"], job);
    expect(ranked.map((s) => s.name)).toEqual(["Kubernetes", "Terraform", "Elixir"]);
    expect(ranked.map((s) => s.mentions)).toEqual([3, 1, 0]);
    expect(ranked.map((s) => s.priority)).toEqual(["high", "medium", "low"]);
  });

  it("breaks ties alphabetically so output is stable", () => {
    const ranked = rankMissingSkills(["Zig", "Ada", "Rust"], "no overlap here");
    expect(ranked.map((s) => s.name)).toEqual(["Ada", "Rust", "Zig"]);
  });

  it("trims names and drops blank entries", () => {
    const ranked = rankMissingSkills(["  Terraform  ", "", "   "], job);
    expect(ranked).toEqual([{ name: "Terraform", mentions: 1, priority: "medium" }]);
  });

  it("returns an empty list when nothing is missing", () => {
    expect(rankMissingSkills([], job)).toEqual([]);
  });
});

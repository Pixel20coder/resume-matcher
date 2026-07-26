import { describe, it, expect } from "vitest";
import { buildShareUrl, decodeResult, encodeResult, SHARE_PARAM } from "./share";
import type { AnalysisResult } from "./types";

const result: AnalysisResult = {
  score: 88,
  summary: "Great fit — café ☕ résumé keywords match.",
  matchedSkills: ["TypeScript", "Node.js"],
  missingSkills: ["Rust"],
  suggestions: ["Built a service handling 1M req/day."],
};

describe("encodeResult / decodeResult", () => {
  it("round trips a result, including non-ASCII text", () => {
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("produces a URL-safe token (no +, /, or =)", () => {
    const token = encodeResult(result);
    expect(token).not.toMatch(/[+/=]/);
  });

  it("returns null for missing or malformed tokens", () => {
    expect(decodeResult(null)).toBeNull();
    expect(decodeResult(undefined)).toBeNull();
    expect(decodeResult("")).toBeNull();
    expect(decodeResult("!!!not-base64!!!")).toBeNull();
  });

  it("returns null when the payload is not an analysis object", () => {
    const token = encodeResult(result).slice(0, 4); // truncated → invalid JSON
    expect(decodeResult(token)).toBeNull();
  });

  it("normalizes a decoded result through parseAnalysis", () => {
    // Hand-encode a partial/oversized payload the way the pure encoder would.
    const raw = JSON.stringify({ score: 250, summary: "ok" });
    const bytes = new TextEncoder().encode(raw);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const token = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const decoded = decodeResult(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.score).toBe(100); // clamped
    expect(decoded!.matchedSkills).toEqual([]); // defaulted
  });
});

describe("buildShareUrl", () => {
  it("appends the encoded result as a query param", () => {
    const url = buildShareUrl("https://example.com/match", result);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://example.com/match");
    expect(decodeResult(parsed.searchParams.get(SHARE_PARAM))).toEqual(result);
  });

  it("replaces any existing share param rather than duplicating it", () => {
    const url = buildShareUrl("https://example.com/match?r=stale", result);
    expect(new URL(url).searchParams.getAll(SHARE_PARAM)).toHaveLength(1);
  });
});

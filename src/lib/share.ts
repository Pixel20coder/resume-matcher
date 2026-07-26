import { parseAnalysis } from "./analyze";
import type { AnalysisResult } from "./types";

/** Query-string parameter that carries an encoded result on a share link. */
export const SHARE_PARAM = "r";

/** UTF-8-safe base64url encode. Works in the browser and in Node. */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Inverse of {@link toBase64Url}. Throws on malformed input. */
function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a result into a compact, URL-safe token. Pure. */
export function encodeResult(result: AnalysisResult): string {
  return toBase64Url(JSON.stringify(result));
}

/**
 * Decode a share token back into a validated AnalysisResult, or null if the
 * token is missing, malformed, or the wrong shape. Never throws. Pure.
 */
export function decodeResult(token: string | null | undefined): AnalysisResult | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token));
    return parseAnalysis(parsed);
  } catch {
    return null;
  }
}

/** Build a full share URL for a result, given the current page origin+path. */
export function buildShareUrl(baseUrl: string, result: AnalysisResult): string {
  const url = new URL(baseUrl);
  url.searchParams.set(SHARE_PARAM, encodeResult(result));
  return url.toString();
}

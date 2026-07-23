import { parseAnalysis } from "./analyze";
import type { AnalysisResult } from "./types";

/** localStorage key holding the most recent analysis session. */
export const STORAGE_KEY = "resume-matcher:last-session";

/** A saved run: the inputs the user typed plus the result they got back. */
export interface SavedSession {
  resume: string;
  jobDescription: string;
  result: AnalysisResult;
}

/** Serialize a session to a JSON string for persistence. Pure. */
export function serializeSession(session: SavedSession): string {
  return JSON.stringify(session);
}

/**
 * Parse a stored string back into a SavedSession, or return null if it is
 * missing, malformed, or the wrong shape. Never throws. Pure.
 */
export function parseSession(raw: string | null): SavedSession | null {
  if (!raw) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;

  const { resume, jobDescription, result } = obj as Record<string, unknown>;
  if (typeof resume !== "string" || typeof jobDescription !== "string") return null;
  if (typeof result !== "object" || result === null) return null;

  try {
    return { resume, jobDescription, result: parseAnalysis(result) };
  } catch {
    return null;
  }
}

/** Read the saved session from localStorage, if any. Safe on the server. */
export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSession(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persist a session to localStorage. Silently no-ops if storage is unavailable. */
export function saveSession(session: SavedSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeSession(session));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

/** Remove any saved session from localStorage. */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

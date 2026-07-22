/** Shape of the analysis returned by the /api/analyze endpoint. */
export interface AnalysisResult {
  /** Overall fit of the resume to the job, 0–100. */
  score: number;
  /** One-line summary of the match. */
  summary: string;
  /** Skills/keywords the job asks for that the resume already covers. */
  matchedSkills: string[];
  /** Skills/keywords the job asks for that the resume is missing. */
  missingSkills: string[];
  /** Rewritten, tailored resume bullet suggestions. */
  suggestions: string[];
}

/** Request body accepted by the /api/analyze endpoint. */
export interface AnalyzeRequest {
  resume: string;
  jobDescription: string;
}

/** Minimum characters required for each input to be worth analyzing. */
export const MIN_INPUT_LENGTH = 50;

/** Maximum characters accepted per input, to bound token cost and abuse. */
export const MAX_INPUT_LENGTH = 20_000;

/** A validated pair of trimmed inputs ready to send to the model. */
export interface ValidatedInput {
  resume: string;
  jobDescription: string;
}

/**
 * Validate raw request fields. Returns either the trimmed, ready-to-use inputs
 * or a human-readable error describing the first problem found.
 */
export function validateInput(
  resume: unknown,
  jobDescription: unknown,
): { ok: true; value: ValidatedInput } | { ok: false; error: string } {
  const fields: [string, unknown][] = [
    ["Resume", resume],
    ["Job description", jobDescription],
  ];
  const trimmed: string[] = [];
  for (const [label, raw] of fields) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length < MIN_INPUT_LENGTH) {
      return { ok: false, error: `${label} needs at least ${MIN_INPUT_LENGTH} characters.` };
    }
    if (value.length > MAX_INPUT_LENGTH) {
      return { ok: false, error: `${label} must be under ${MAX_INPUT_LENGTH} characters.` };
    }
    trimmed.push(value);
  }
  return { ok: true, value: { resume: trimmed[0], jobDescription: trimmed[1] } };
}

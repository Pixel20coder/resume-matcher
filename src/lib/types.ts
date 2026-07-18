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

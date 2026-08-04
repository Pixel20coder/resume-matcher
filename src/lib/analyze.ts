import { chat } from "./llm";
import {
  DEFAULT_TONE,
  type AnalysisResult,
  type CategoryScore,
  type SuggestionTone,
} from "./types";

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume coach.
Compare a candidate's resume against a job description and respond with ONLY a
JSON object (no prose, no code fences) matching exactly this shape:

{
  "score": <integer 0-100, how well the resume fits the job>,
  "summary": "<one sentence overall assessment>",
  "categories": [
    {"name": "Skills", "score": <0-100>},
    {"name": "Experience", "score": <0-100>},
    {"name": "Keywords", "score": <0-100>},
    {"name": "Education", "score": <0-100>}
  ],
  "matchedSkills": ["<skills/keywords the job wants that the resume already shows>"],
  "missingSkills": ["<skills/keywords the job wants that the resume lacks>"],
  "suggestions": ["<3-5 rewritten, achievement-focused resume bullets tailored to this job>"]
}`;

/** A one-line steer for the voice of the bullet suggestions. */
export function toneInstruction(tone: SuggestionTone): string {
  switch (tone) {
    case "concise":
      return "Write the suggestions as short, punchy bullets — one line each, no filler.";
    case "friendly":
      return "Write the suggestions in a warm, approachable first-person voice.";
    case "impact":
    default:
      return "Write the suggestions as metrics-driven, achievement-focused bullets that quantify impact.";
  }
}

export function buildMessages(
  resume: string,
  jobDescription: string,
  tone: SuggestionTone = DEFAULT_TONE,
) {
  return [
    { role: "system" as const, content: `${SYSTEM_PROMPT}\n\n${toneInstruction(tone)}` },
    {
      role: "user" as const,
      content: `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
    },
  ];
}

/** Pull a JSON object out of a model reply that may include prose or ```fences. */
export function extractJson(raw: string): unknown {
  const withoutFences = raw.replace(/```(?:json)?/gi, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response.");
  }
  return JSON.parse(withoutFences.slice(start, end + 1));
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/**
 * Trim, drop empties, and case-insensitively de-duplicate a skill list,
 * keeping the first-seen casing. Models often repeat "React" / "react".
 */
export const normalizeSkills = (value: unknown): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of asStringArray(value)) {
    const trimmed = raw.trim();
    const key = trimmed.toLowerCase();
    if (trimmed === "" || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

/** Remove from `list` any skill that already appears in `exclude` (case-insensitive). */
export const subtractSkills = (list: string[], exclude: string[]): string[] => {
  const blocked = new Set(exclude.map((s) => s.toLowerCase()));
  return list.filter((s) => !blocked.has(s.toLowerCase()));
};

/** Coerce any value to an integer score in [0, 100], defaulting to 0. */
const clampScore = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
};

/** Normalize the category breakdown, dropping unnamed or malformed entries. */
const asCategories = (value: unknown): CategoryScore[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): CategoryScore[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const { name, score } = entry as Record<string, unknown>;
    if (typeof name !== "string" || name.trim() === "") return [];
    return [{ name: name.trim(), score: clampScore(score) }];
  });
};

/** Validate and normalize a parsed object into an AnalysisResult. */
export function parseAnalysis(parsed: unknown): AnalysisResult {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Model response was not an object.");
  }
  const obj = parsed as Record<string, unknown>;

  const matchedSkills = normalizeSkills(obj.matchedSkills);
  // A skill can't be both present and missing — matched wins.
  const missingSkills = subtractSkills(normalizeSkills(obj.missingSkills), matchedSkills);

  return {
    score: clampScore(obj.score),
    summary: typeof obj.summary === "string" ? obj.summary : "",
    categories: asCategories(obj.categories),
    matchedSkills,
    missingSkills,
    suggestions: asStringArray(obj.suggestions),
  };
}

/** Run the full analysis: prompt the model and return a validated result. */
export async function analyze(
  resume: string,
  jobDescription: string,
  tone: SuggestionTone = DEFAULT_TONE,
): Promise<AnalysisResult> {
  const reply = await chat(buildMessages(resume, jobDescription, tone));
  return parseAnalysis(extractJson(reply));
}

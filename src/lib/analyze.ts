import { chat } from "./llm";
import { DEFAULT_TONE, type AnalysisResult, type SuggestionTone } from "./types";

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume coach.
Compare a candidate's resume against a job description and respond with ONLY a
JSON object (no prose, no code fences) matching exactly this shape:

{
  "score": <integer 0-100, how well the resume fits the job>,
  "summary": "<one sentence overall assessment>",
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

/** Validate and normalize a parsed object into an AnalysisResult. */
export function parseAnalysis(parsed: unknown): AnalysisResult {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Model response was not an object.");
  }
  const obj = parsed as Record<string, unknown>;
  const rawScore = typeof obj.score === "number" ? obj.score : Number(obj.score);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;

  return {
    score,
    summary: typeof obj.summary === "string" ? obj.summary : "",
    matchedSkills: asStringArray(obj.matchedSkills),
    missingSkills: asStringArray(obj.missingSkills),
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

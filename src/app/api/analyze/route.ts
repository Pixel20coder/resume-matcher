import { analyze } from "@/lib/analyze";
import { LlmError } from "@/lib/llm";
import { MIN_INPUT_LENGTH, type AnalyzeRequest } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  let body: Partial<AnalyzeRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const resume = typeof body.resume === "string" ? body.resume.trim() : "";
  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

  if (resume.length < MIN_INPUT_LENGTH || jobDescription.length < MIN_INPUT_LENGTH) {
    return Response.json(
      { error: `Both fields need at least ${MIN_INPUT_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const result = await analyze(resume, jobDescription);
    return Response.json(result);
  } catch (err) {
    if (err instanceof LlmError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    console.error("Analysis failed:", err);
    return Response.json(
      { error: "Could not analyze the resume. Please try again." },
      { status: 502 },
    );
  }
}

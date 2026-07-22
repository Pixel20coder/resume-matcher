import { analyze } from "@/lib/analyze";
import { LlmError } from "@/lib/llm";
import { validateInput, type AnalyzeRequest } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  let body: Partial<AnalyzeRequest>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateInput(body.resume, body.jobDescription);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const { resume, jobDescription } = validation.value;
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

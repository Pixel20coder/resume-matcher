/**
 * Minimal client for an OpenAI-compatible chat-completions endpoint.
 * Defaults to NVIDIA NIM's free hosted models; override with env vars.
 */

const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct-v0.3";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LlmError extends Error {}

/** Send chat messages to the model and return the assistant's text reply. */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new LlmError("NVIDIA_API_KEY is not set. Add it to .env.local.");
  }

  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new LlmError(`Model request failed (${res.status}). ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new LlmError("Model returned an empty response.");
  }
  return content;
}

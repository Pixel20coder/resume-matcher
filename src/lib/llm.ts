/**
 * Minimal client for an OpenAI-compatible chat-completions endpoint.
 * Defaults to NVIDIA NIM's free hosted models; override with env vars.
 */

const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct-v0.3";

/** How many extra attempts to make after the first one fails transiently. */
export const MAX_RETRIES = 2;
/** Base delay (ms) for exponential backoff between retries. */
export const BASE_RETRY_DELAY_MS = 500;
/** Abort a single model request that takes longer than this. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** HTTP statuses worth retrying: rate limits, timeouts, and transient 5xx. */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LlmError extends Error {}

/** A transient failure that is safe to retry. Still an LlmError to callers. */
export class RetryableError extends LlmError {}

/** Whether an HTTP status code represents a transient, retryable failure. */
export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

/** Exponential backoff delay (ms) for a given zero-based attempt number. */
export function backoffDelay(attempt: number, base = BASE_RETRY_DELAY_MS): number {
  return base * 2 ** attempt;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface RetryOptions {
  retries?: number;
  base?: number;
  shouldRetry?: (error: unknown) => boolean;
  wait?: (ms: number) => Promise<void>;
}

/**
 * Run `fn`, retrying with exponential backoff while `shouldRetry` returns true
 * and attempts remain. Re-throws the last error once retries are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = MAX_RETRIES,
    base = BASE_RETRY_DELAY_MS,
    shouldRetry = (e) => e instanceof RetryableError,
    wait = sleep,
  }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetry(error)) break;
      await wait(backoffDelay(attempt, base));
    }
  }
  throw lastError;
}

/** Perform a single chat-completions request. Transient failures throw RetryableError. */
async function requestOnce(url: string, apiKey: string, body: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // Network failures and timeouts are transient — let the caller retry.
    throw new RetryableError(`Could not reach the model (${reason}).`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const message = `Model request failed (${res.status}). ${detail.slice(0, 200)}`;
    throw isRetryableStatus(res.status)
      ? new RetryableError(message)
      : new LlmError(message);
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

/** Send chat messages to the model and return the assistant's text reply. */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new LlmError("NVIDIA_API_KEY is not set. Add it to .env.local.");
  }

  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const url = `${baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.2,
    max_tokens: 1200,
  });

  return withRetry(() => requestOnce(url, apiKey, body));
}

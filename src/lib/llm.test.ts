import { describe, it, expect, vi } from "vitest";
import {
  backoffDelay,
  isRetryableStatus,
  withRetry,
  RetryableError,
  LlmError,
  BASE_RETRY_DELAY_MS,
} from "./llm";

describe("isRetryableStatus", () => {
  it("treats rate limits, timeouts, and transient 5xx as retryable", () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      expect(isRetryableStatus(status)).toBe(true);
    }
  });

  it("treats client errors and success as non-retryable", () => {
    for (const status of [200, 400, 401, 403, 404, 422]) {
      expect(isRetryableStatus(status)).toBe(false);
    }
  });
});

describe("backoffDelay", () => {
  it("doubles the base delay with each attempt", () => {
    expect(backoffDelay(0)).toBe(BASE_RETRY_DELAY_MS);
    expect(backoffDelay(1)).toBe(BASE_RETRY_DELAY_MS * 2);
    expect(backoffDelay(2)).toBe(BASE_RETRY_DELAY_MS * 4);
  });

  it("respects a custom base", () => {
    expect(backoffDelay(3, 10)).toBe(80);
  });
});

describe("withRetry", () => {
  const noWait = vi.fn(async () => {});

  it("returns immediately on first success without waiting", async () => {
    const fn = vi.fn(async () => "ok");
    expect(await withRetry(fn, { wait: noWait })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(noWait).not.toHaveBeenCalled();
  });

  it("retries transient failures then succeeds", async () => {
    const wait = vi.fn(async () => {});
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new RetryableError("blip"))
      .mockRejectedValueOnce(new RetryableError("blip"))
      .mockResolvedValue("recovered");

    expect(await withRetry(fn, { wait })).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenNthCalledWith(1, backoffDelay(0));
    expect(wait).toHaveBeenNthCalledWith(2, backoffDelay(1));
  });

  it("gives up after exhausting retries and rethrows the last error", async () => {
    const err = new RetryableError("still down");
    const fn = vi.fn(async () => {
      throw err;
    });
    await expect(withRetry(fn, { retries: 2, wait: noWait })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry a non-retryable error", async () => {
    const err = new LlmError("bad request");
    const fn = vi.fn(async () => {
      throw err;
    });
    await expect(withRetry(fn, { wait: noWait })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("honors a custom shouldRetry predicate", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("odd"))
      .mockResolvedValue("done");
    const result = await withRetry(fn, {
      wait: noWait,
      shouldRetry: (e) => e instanceof Error && e.message === "odd",
    });
    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

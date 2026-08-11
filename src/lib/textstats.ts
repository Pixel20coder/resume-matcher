/** Words read per minute, used to estimate reading time. */
export const WORDS_PER_MINUTE = 200;

/** Basic readability stats for a block of text. */
export interface TextStats {
  /** Whitespace-delimited word count. */
  words: number;
  /** Number of sentences (runs ending in . ! or ?; at least 1 if any words). */
  sentences: number;
  /** Estimated reading time in seconds at {@link WORDS_PER_MINUTE}. */
  readingTimeSeconds: number;
}

/** Compute word count, sentence count, and reading time for text. Pure. */
export function textStats(text: string): TextStats {
  const trimmed = text.trim();
  if (trimmed === "") return { words: 0, sentences: 0, readingTimeSeconds: 0 };

  const words = trimmed.split(/\s+/).length;
  // Count sentence-ending runs; guarantee at least one sentence when text exists.
  const enders = trimmed.match(/[.!?]+(?=\s|$)/g)?.length ?? 0;
  const sentences = Math.max(1, enders);
  const readingTimeSeconds = Math.max(1, Math.round((words / WORDS_PER_MINUTE) * 60));

  return { words, sentences, readingTimeSeconds };
}

/** Human-friendly reading time, e.g. "8s" or "2m 5s". Pure. */
export function formatReadingTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

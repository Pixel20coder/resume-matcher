/** Common words to ignore when extracting meaningful keywords. */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "has", "that", "this", "from", "not", "but", "all", "any", "can", "who",
  "how", "why", "what", "when", "where", "which", "their", "they", "them",
  "his", "her", "its", "was", "were", "been", "being", "into", "out", "off",
  "over", "under", "than", "then", "such", "some", "more", "most", "other",
  "about", "also", "each", "per", "via", "etc", "role", "job", "work",
  "team", "years", "year", "experience", "ability", "strong", "good",
  "including", "well", "must", "should", "would", "could", "may", "able",
  "using", "used", "use", "new", "help", "within", "across", "plus",
  // Common two-letter words, so meaningful tech terms (go, ai, ml, ui, qa) survive.
  "of", "to", "in", "is", "it", "as", "at", "by", "or", "on", "be", "we",
  "us", "an", "if", "so", "no", "do", "my", "me", "he", "up",
]);

/** A keyword and how often it appears in the source text. */
export interface Keyword {
  term: string;
  count: number;
}

/** Split text into lowercase word tokens (letters, digits, +, #, . inside). */
export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*[a-z0-9+#]|[a-z0-9]/g);
  return matches ?? [];
}

/** True when a token is worth counting as a keyword. */
function isMeaningful(token: string): boolean {
  if (token.length < 2) return false;
  if (STOPWORDS.has(token)) return false;
  // Skip pure numbers like "2024" or "10".
  if (/^\d+$/.test(token)) return false;
  return true;
}

/**
 * Extract the most frequent meaningful terms from a job description, most
 * common first (ties broken alphabetically for stable output). Pure.
 */
export function extractKeywords(text: string, limit = 15): Keyword[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (isMeaningful(token)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, Math.max(0, limit));
}

/** Which of the given keywords appear as tokens in the resume, and which don't. */
export function keywordCoverage(
  resume: string,
  keywords: Keyword[],
): { covered: Keyword[]; missing: Keyword[] } {
  const resumeTokens = new Set(tokenize(resume));
  const covered: Keyword[] = [];
  const missing: Keyword[] = [];
  for (const keyword of keywords) {
    (resumeTokens.has(keyword.term) ? covered : missing).push(keyword);
  }
  return { covered, missing };
}

/** Fraction of keywords covered by the resume, 0–100 (0 when there are none). */
export function coverageScore(covered: number, total: number): number {
  return total === 0 ? 0 : Math.round((covered / total) * 100);
}

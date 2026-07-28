// Character classes for the invisible/exotic characters that pasted resume and
// job-description text tends to carry.
const ZERO_WIDTH = /[​-‍﻿]/g;
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const EXOTIC_SPACE = /[  -   　]/g;
const BULLET_LINE = /^[ \t]*[•‣◦·▪∙‧⁃*]\s+/gm;

/**
 * Clean up text pasted from PDFs, Word, or web pages before it is sent to the
 * model: unify newlines, strip invisible junk, normalize bullet glyphs, and
 * tidy whitespace. Pure and idempotent -- running it twice changes nothing.
 */
export function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n") // unify line endings
    .replace(ZERO_WIDTH, "") // drop zero-width chars and BOM
    .replace(CONTROL, "") // drop control chars (keep tab and newline)
    .replace(EXOTIC_SPACE, " ") // non-breaking / exotic spaces -> plain space
    .replace(BULLET_LINE, "- ") // bullet glyphs at line start -> "- "
    .replace(/[ \t]{2,}/g, " ") // collapse runs of spaces/tabs
    .replace(/[ \t]+$/gm, "") // trim trailing whitespace per line
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines to one blank line
    .trim();
}

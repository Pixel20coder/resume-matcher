import { describe, it, expect } from "vitest";
import { normalizeText } from "./normalize";

const ch = String.fromCharCode;
const ZWSP = ch(0x200b);
const ZWNJ = ch(0x200c);
const ZWJ = ch(0x200d);
const BOM = ch(0xfeff);
const NBSP = ch(0x00a0);
const EN_QUAD = ch(0x2000);
const IDEOGRAPHIC_SPACE = ch(0x3000);
const BULLET = ch(0x2022); // •
const WHITE_BULLET = ch(0x25e6); // ◦

describe("normalizeText", () => {
  it("unifies CRLF and CR line endings to LF", () => {
    expect(normalizeText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("strips zero-width characters and the BOM", () => {
    const dirty = `Java${ZWSP}Script${BOM} Dev${ZWJ}elop${ZWNJ}er`;
    expect(normalizeText(dirty)).toBe("JavaScript Developer");
  });

  it("removes stray control characters but keeps tabs", () => {
    expect(normalizeText("a\x00b\x07c")).toBe("abc");
    expect(normalizeText("col1\tcol2")).toBe("col1\tcol2");
  });

  it("normalizes non-breaking and exotic spaces to a plain space", () => {
    expect(normalizeText(`5${NBSP}years${EN_QUAD}exp${IDEOGRAPHIC_SPACE}here`)).toBe(
      "5 years exp here",
    );
  });

  it("converts bullet glyphs at line start into dashes", () => {
    const input = `${BULLET} Led team\n  ${WHITE_BULLET} Shipped v1\n* Wrote docs`;
    expect(normalizeText(input)).toBe("- Led team\n- Shipped v1\n- Wrote docs");
  });

  it("collapses repeated spaces and trailing whitespace", () => {
    expect(normalizeText("too    many   spaces   ")).toBe("too many spaces");
    expect(normalizeText("line one   \nline two\t")).toBe("line one\nline two");
  });

  it("collapses 3+ blank lines to a single blank line", () => {
    expect(normalizeText("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading and trailing whitespace overall", () => {
    expect(normalizeText("\n\n  hello  \n\n")).toBe("hello");
  });

  it("is idempotent", () => {
    const messy = `${BOM}${BULLET} A B\r\n\n\n\n* C  \n`;
    const once = normalizeText(messy);
    expect(normalizeText(once)).toBe(once);
  });
});

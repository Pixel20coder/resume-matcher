import { describe, it, expect } from "vitest";
import { textStats, formatReadingTime, WORDS_PER_MINUTE } from "./textstats";

describe("textStats", () => {
  it("returns zeros for empty or whitespace input", () => {
    expect(textStats("")).toEqual({ words: 0, sentences: 0, readingTimeSeconds: 0 });
    expect(textStats("   \n\t ")).toEqual({ words: 0, sentences: 0, readingTimeSeconds: 0 });
  });

  it("counts whitespace-delimited words", () => {
    expect(textStats("Led a team of five engineers").words).toBe(6);
    expect(textStats("  extra   spaces\nand\tnewlines  ").words).toBe(4);
  });

  it("counts sentences by terminal punctuation", () => {
    expect(textStats("One. Two! Three?").sentences).toBe(3);
    expect(textStats("Wait... really?!").sentences).toBe(2); // grouped runs
  });

  it("treats text with no terminal punctuation as one sentence", () => {
    expect(textStats("a resume bullet with no period").sentences).toBe(1);
  });

  it("estimates reading time at the configured WPM, rounded, min 1s", () => {
    const words = WORDS_PER_MINUTE; // exactly one minute of reading
    expect(textStats("word ".repeat(words)).readingTimeSeconds).toBe(60);
    expect(textStats("just three words").readingTimeSeconds).toBe(1); // rounds to >=1
  });
});

describe("formatReadingTime", () => {
  it("formats seconds under a minute", () => {
    expect(formatReadingTime(8)).toBe("8s");
    expect(formatReadingTime(0)).toBe("0s");
  });

  it("formats whole minutes and minute+second mixes", () => {
    expect(formatReadingTime(120)).toBe("2m");
    expect(formatReadingTime(125)).toBe("2m 5s");
  });
});

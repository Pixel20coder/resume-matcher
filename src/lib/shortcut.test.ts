import { describe, it, expect } from "vitest";
import { isSubmitShortcut } from "./shortcut";

describe("isSubmitShortcut", () => {
  it("matches Cmd+Enter and Ctrl+Enter", () => {
    expect(isSubmitShortcut({ key: "Enter", metaKey: true, ctrlKey: false })).toBe(true);
    expect(isSubmitShortcut({ key: "Enter", metaKey: false, ctrlKey: true })).toBe(true);
  });

  it("ignores a plain Enter with no modifier", () => {
    expect(isSubmitShortcut({ key: "Enter", metaKey: false, ctrlKey: false })).toBe(false);
  });

  it("ignores other keys even with a modifier", () => {
    expect(isSubmitShortcut({ key: "a", metaKey: true, ctrlKey: false })).toBe(false);
    expect(isSubmitShortcut({ key: "s", metaKey: false, ctrlKey: true })).toBe(false);
  });
});

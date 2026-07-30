/** The parts of a keyboard event that decide the submit shortcut. */
export interface KeyChord {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

/**
 * True when the chord is the "submit" shortcut: Cmd+Enter (macOS) or
 * Ctrl+Enter (Windows/Linux). Pure — takes only the fields it needs.
 */
export function isSubmitShortcut(chord: KeyChord): boolean {
  return chord.key === "Enter" && (chord.metaKey || chord.ctrlKey);
}

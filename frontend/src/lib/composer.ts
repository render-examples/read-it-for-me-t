/** Pure helpers for digest composer validation (testable without DOM). */
import { COPY } from "./copy.ts";

/** Returns validation message when composer has no usable input. */
export function validateComposerInput(
  input: string,
  pdfCount: number
): string | null {
  if (input.trim() || pdfCount > 0) return null;
  return COPY.composer.emptyError;
}

/** Split raw composer text into URL lines and note lines. */
export function splitComposerInput(raw: string): { urls: string; text: string } {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const urlLines = lines.filter((line) => /^https?:\/\//i.test(line));
  const textLines = lines.filter((line) => !/^https?:\/\//i.test(line));
  return { urls: urlLines.join("\n"), text: textLines.join("\n") };
}

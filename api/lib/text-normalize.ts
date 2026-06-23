// Lowercase and remove all whitespace, punctuation, and symbols (Unicode-aware).
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

// Returns the first word that appears as a substring of normalizedText, else null.
// `words` are assumed to be already normalized.
export function findBlockedWord(
  normalizedText: string,
  words: string[],
): string | null {
  for (const w of words) {
    if (w && normalizedText.includes(w)) return w;
  }
  return null;
}

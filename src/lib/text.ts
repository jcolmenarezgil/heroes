/**
 * Removes diacritics and lowercases a string for accent-insensitive search.
 * "María" → "maria", "José" → "jose", etc.
 */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

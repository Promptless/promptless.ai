/** Match indexed words and identifiers, including components of dotted/hyphenated names. */
export function matchRanges(text: string, terms: string[]): { start: number; end: number }[] {
  const alternatives = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!alternatives) return [];
  // Keep contraction fragments from being highlighted as standalone words.
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_'’])(?:${alternatives})(?![\\p{L}\\p{N}_'’])`, 'giu');
  return [...text.matchAll(pattern)].map((match) => ({ start: match.index, end: match.index + match[0].length }));
}

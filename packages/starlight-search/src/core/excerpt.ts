export function excerpt(text: string, terms: string[], length = 180): string {
  const lower = text.toLocaleLowerCase();
  const positions = terms.map((term) => lower.indexOf(term.toLocaleLowerCase())).filter((position) => position >= 0);
  const start = Math.max(0, (positions.length ? Math.min(...positions) : 0) - 55);
  return `${start ? '…' : ''}${text.slice(start, start + length)}${text.length > start + length ? '…' : ''}`;
}

import { matchRanges } from './matches';

export function excerpt(text: string, terms: string[], length = 180): string {
  let start = Math.max(0, (matchRanges(text, terms)[0]?.start ?? 0) - 55);
  if (start) start = text.lastIndexOf(' ', start) + 1;
  return `${start ? '…' : ''}${text.slice(start, start + length)}${text.length > start + length ? '…' : ''}`;
}

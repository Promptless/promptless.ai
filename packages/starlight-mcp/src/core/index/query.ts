/**
 * Request-time querying over the build-time content index.
 *
 * Pure functions, no I/O — runs on any runtime. All results are filtered by the
 * caller's `Identity` via `visibleTo`, which is where the auth seam bites: an
 * anonymous caller (v1) only ever sees `public` pages.
 */
import type { Identity } from '../auth/provider';
import type { DocEntry } from './types';

export interface SearchResult {
  title: string;
  url: string;
  path: string;
  lang: string;
  snippet: string;
  score: number;
}

/** Whether `entry` is visible to `identity`. The single gating decision point. */
export function visibleTo(entry: DocEntry, identity: Identity): boolean {
  if (entry.access === 'public') return true;
  // `internal` pages require a user identity whose groups intersect the page's
  // groups (an `internal` page with no groups is visible to any authenticated user).
  if (identity.kind === 'user') {
    return entry.groups.length === 0 || entry.groups.some((g) => identity.groups.includes(g));
  }
  return false;
}

function tokenize(s: string): string[] {
  // Unicode-aware: match runs of letters/numbers across scripts (Latin, CJK, etc.)
  // rather than splitting on non-[a-z0-9], which dropped all non-ASCII text.
  return s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count++;
    i += needle.length;
  }
  return count;
}

function buildSnippet(text: string, terms: string[], max = 240): string {
  const lower = text.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (at === -1 || idx < at)) at = idx;
  }
  if (at === -1) return text.slice(0, max).trim();
  const start = Math.max(0, at - 60);
  const slice = text.slice(start, start + max).trim();
  return (start > 0 ? '…' : '') + slice + (start + max < text.length ? '…' : '');
}

export interface SearchOptions {
  query: string;
  lang?: string;
  limit?: number;
}

export function searchDocs(
  index: DocEntry[],
  identity: Identity,
  { query, lang, limit = 10 }: SearchOptions,
): SearchResult[] {
  const terms = tokenize(query);
  const phrase = query.trim().toLowerCase();
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of index) {
    if (!visibleTo(entry, identity)) continue;
    if (lang && entry.lang !== lang) continue;

    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      score += countOccurrences(title, term) * 5;
      score += countOccurrences(text, term);
    }
    // Phrase + title-substring bonuses to surface the most direct matches.
    if (phrase.length > 2 && text.includes(phrase)) score += 3;
    if (title.includes(phrase)) score += 8;
    if (score <= 0) continue;

    results.push({
      title: entry.title,
      url: entry.url,
      path: entry.path,
      lang: entry.lang,
      snippet: buildSnippet(entry.text, terms),
      score,
    });
  }

  results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return results.slice(0, Math.max(1, Math.min(limit, 50)));
}

/** Normalize a user-supplied path or full URL to a comparable route path. */
export function normalizePath(input: string): string {
  let p = input.trim();
  try {
    // Resolve against a dummy base so both bare paths and absolute URLs work; this
    // strips any query string and fragment and yields just the pathname.
    p = new URL(p, 'http://x').pathname;
  } catch {
    /* fall through with the raw string */
  }
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p = p + '/';
  return p.replace(/\/{2,}/g, '/'); // collapse duplicate slashes
}

export function getPage(
  index: DocEntry[],
  identity: Identity,
  pathOrUrl: string,
): DocEntry | undefined {
  const target = normalizePath(pathOrUrl);
  const matches = (p: string) => p === target || normalizePath(p) === target;
  // Exact match first; fall back to case-insensitive (models often re-case paths).
  const lower = target.toLowerCase();
  const ciMatches = (p: string) => p.toLowerCase() === lower || normalizePath(p).toLowerCase() === lower;
  const entry =
    index.find((e) => matches(e.path) || matches(e.url)) ??
    index.find((e) => ciMatches(e.path) || ciMatches(e.url));
  if (!entry || !visibleTo(entry, identity)) return undefined;
  return entry;
}

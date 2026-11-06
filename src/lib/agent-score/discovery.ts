/**
 * Why a scan tested too few pages to represent the site, and which URL to
 * scan instead.
 *
 * afdocs uses the path of the scanned URL as a filter: it tests only the pages
 * below that path that it finds in llms.txt or a sitemap. A deep URL therefore
 * tests one page, and so does a site with no llms.txt and no sitemap.
 */
import { normalizeTargetUrl } from './slug';
import type { ScanResult } from './types';

/**
 * afdocs `MIN_PAGES_FOR_SCORING`. Below it, afdocs does not score the
 * page-level categories, and the backend keeps the scan off the leaderboard.
 */
export const MIN_PAGES_FOR_SCORING = 5;

export type PartialScan =
  /** afdocs found an llms.txt above the scanned path; `suggestion` is its folder. */
  | { kind: 'index_above'; testedPages: number; indexUrl: string; suggestion: string }
  /** The URL has a path and no llms.txt was found above it; `suggestion` is the host root. */
  | { kind: 'deep_url'; testedPages: number; suggestion: string }
  /** A host root where afdocs found no llms.txt and no sitemap. */
  | { kind: 'no_index'; testedPages: number }
  /** A host root where afdocs found an llms.txt or a sitemap with too few pages. */
  | { kind: 'few_pages'; testedPages: number };

/** The cause of a partial scan, or `null` when afdocs tested enough pages. */
export function partialScan(latest: ScanResult): PartialScan | null {
  const testedPages = latest.testedPages;
  if (testedPages === undefined || testedPages >= MIN_PAGES_FOR_SCORING) return null;
  const [host, ...segments] = latest.slug.split('/');
  const indexUrl = llmsTxtUrl(latest);
  const indexFolder = indexUrl ? folderSlug(indexUrl) : null;
  if (indexUrl && indexFolder && isAncestor(indexFolder, latest.slug)) {
    return { kind: 'index_above', testedPages, indexUrl, suggestion: indexFolder };
  }
  if (segments.length > 0) return { kind: 'deep_url', testedPages, suggestion: host };
  return (latest.discoverySources ?? []).includes('fallback')
    ? { kind: 'no_index', testedPages }
    : { kind: 'few_pages', testedPages };
}

/**
 * Whether a URL typed into the scan form looks like one page rather than a
 * docs root: three or more path segments, or a last segment with a page
 * extension such as `.html`.
 */
export function looksLikeSinglePage(input: string): boolean {
  const normalized = normalizeTargetUrl(input);
  if (!normalized.ok) return false;
  const segments = normalized.value.slug.split('/').slice(1);
  return segments.length >= 3 || /\.(html?|php|aspx?)$/i.test(segments.at(-1) ?? '');
}

/** The llms.txt afdocs chose, from the `llms-txt-exists` check evidence. */
function llmsTxtUrl(latest: ScanResult): string | null {
  for (const category of latest.categories) {
    const check = category.checks.find((candidate) => candidate.id === 'llms-txt-exists');
    if (check) {
      const url = check.evidence?.canonicalUrl;
      return typeof url === 'string' ? url : null;
    }
  }
  return null;
}

/** The slug of the folder that holds a file URL: `https://a.com/docs/llms.txt` is `a.com/docs`. */
function folderSlug(fileUrl: string): string | null {
  let folder: URL;
  try {
    folder = new URL('.', fileUrl);
  } catch {
    return null;
  }
  const normalized = normalizeTargetUrl(folder.href);
  return normalized.ok ? normalized.value.slug : null;
}

function isAncestor(ancestor: string, slug: string): boolean {
  return slug.startsWith(`${ancestor}/`);
}

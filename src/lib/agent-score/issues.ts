/**
 * The score page's issue list: diagnostics and non-passing checks, each with a
 * plain fix and the pages afdocs flagged.
 */
import { actionableChecks } from './report';
import type { CheckResult, CheckStatus, Diagnostic, ScanResult } from './types';

export interface AffectedPage {
  url: string;
  /** The one number that matters for this page, e.g. "130K chars". */
  note: string;
}

export interface Issue {
  key: string;
  status: Extract<CheckStatus, 'fail' | 'warn' | 'error'>;
  title: string;
  summary: string;
  fix: string | null;
  pages: AffectedPage[];
  pageTotal: number;
}

const kb = (chars: number) => `${Math.round(chars / 1000)}K chars`;
const mb = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

type Row = Record<string, unknown>;

/** Non-passing pages or URLs a check found, from its afdocs evidence. */
export function affectedPages(check: CheckResult): { pages: AffectedPage[]; total: number } {
  const evidence = (check.evidence ?? {}) as Row;
  if (check.id === 'llms-txt-links-resolve') {
    const broken = Array.isArray(evidence.broken) ? (evidence.broken as Row[]) : [];
    return { pages: broken.map((row) => ({ url: String(row.url), note: row.status ? `HTTP ${row.status}` : '' })), total: broken.length };
  }
  const results = Array.isArray(evidence.pageResults) ? (evidence.pageResults as Row[]) : [];
  const rows = results.filter((row) => typeof row.url === 'string' && (row.status === 'warn' || row.status === 'fail'));
  const note = (row: Row): string => {
    switch (check.id) {
      case 'page-size-markdown':
        return typeof row.characters === 'number' ? kb(row.characters) : '';
      case 'page-size-transfer':
        return typeof row.servedBytes === 'number' && typeof row.contentCharacters === 'number'
          ? `${mb(row.servedBytes)} for ${kb(row.contentCharacters)}`
          : '';
      case 'markdown-content-parity':
        return typeof row.missingPercent === 'number' ? `${row.missingPercent}% missing` : '';
      case 'markdown-link-portability':
        return Array.isArray(row.issues) && row.issues.length ? String(row.issues[0]) : '';
      default:
        return '';
    }
  };
  // afdocs trims pageResults; the bucket counts still cover every tested page.
  const buckets = Number(evidence.warnBucket ?? 0) + Number(evidence.failBucket ?? 0);
  return { pages: rows.map((row) => ({ url: String(row.url), note: note(row) })), total: Math.max(rows.length, buckets) };
}

/**
 * afdocs resolutions usually open by restating the result ("1 of 50 pages
 * exceed…"). The result is already on screen, so drop that sentence.
 */
export function fixText(check: CheckResult): string | null {
  if (!check.resolution) return null;
  const [first, ...rest] = check.resolution.split(/(?<=\.)\s+(?=[A-Z])/);
  return /^\d/.test(first) && rest.length ? rest.join(' ') : check.resolution;
}

/** Plain titles for afdocs diagnostics; unknown ids fall back to the id. */
const DIAGNOSTIC_TITLES: Record<string, string> = {
  'dynamic-content-rendered-statically': 'Markdown versions drop content on generated pages',
};

function diagnosticIssue(diagnostic: Diagnostic): Issue {
  const urls = [...new Set(diagnostic.message.match(/https?:\/\/[^\s:;,]+/g) ?? [])];
  const firstSentence = diagnostic.message.split(/(?<=\.)\s/)[0] ?? diagnostic.message;
  const cause = diagnostic.message.match(/but the cause is shared: ([^]*)$/)?.[1];
  const count = Number(firstSentence.match(/^(\d+)\s/)?.[1]);
  return {
    key: diagnostic.id,
    status: diagnostic.severity === 'critical' ? 'fail' : 'warn',
    title: DIAGNOSTIC_TITLES[diagnostic.id] ?? diagnostic.id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    summary: cause ? cause.replace(/^./, (c) => c.toUpperCase()) : firstSentence,
    fix: diagnostic.resolution,
    pages: urls.map((url) => ({ url, note: '' })),
    pageTotal: Number.isFinite(count) && count > 0 ? count : urls.length,
  };
}

export function diagnosticIssues(latest: ScanResult): Issue[] {
  return latest.diagnostics.map(diagnosticIssue);
}

/** Failing and warning checks keyed by check id, for rendering inside their category. */
export function checkIssues(latest: ScanResult): Map<string, Issue> {
  const issues = new Map<string, Issue>();
  for (const { check } of actionableChecks(latest)) {
    const { pages, total } = affectedPages(check);
    issues.set(check.id, {
      key: check.id,
      status: check.status as Issue['status'],
      title: check.name,
      summary: check.message,
      fix: fixText(check),
      pages,
      pageTotal: total,
    });
  }
  return issues;
}

/** A page URL as a short path when it is on the scanned host. */
export function shortUrl(value: string, host: string): string {
  try {
    const url = new URL(value);
    return url.host === host ? url.pathname : `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

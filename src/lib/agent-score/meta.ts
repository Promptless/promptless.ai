/**
 * Static Agent Score metadata: category order, friendly names, rationale copy,
 * check names, tier weights, and grade colors.
 *
 * The backend already sends human names for categories and checks; these
 * tables are the fallback for unknown or missing names and the source for the
 * landing page methodology section. They describe afdocs 0.22.x
 * (Agent-Friendly Docs Spec v0.6.0, scoring 0.2.0).
 */
import type { CheckStatus, CheckTier, Grade } from './types';

export const AFDOCS_VERSION = '0.22.2';
export const SPEC_VERSION = 'v0.6.0';
export const AFDOCS_REPO_URL = 'https://github.com/agent-ecosystem/afdocs';
export const AFDOCS_SITE_URL = 'https://afdocs.dev';
export const AFDOCS_SCORING_URL = 'https://afdocs.dev/agent-score-calculation';
export const AFDOCS_CHECKS_URL = 'https://afdocs.dev/checks/';
export const SPEC_URL = 'https://agentdocsspec.com/spec/web/';
export const AUTHOR_URL = 'https://github.com/dacharyc';
export const BLOG_POST_PATH = '/blog/technical/agent-friendly-docs-necessary-not-sufficient';

export const TIER_WEIGHTS: Record<CheckTier, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 2,
};

export interface CategoryMeta {
  id: string;
  name: string;
  /** One-line reason the category matters to an agent. */
  rationale: string;
  checks: Array<{ id: string; tier: CheckTier }>;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'content-discoverability',
    name: 'Content Discoverability',
    rationale: 'Agents need an entry point they can find, usually llms.txt, before they can reach the right page.',
    checks: [
      { id: 'llms-txt-exists', tier: 'critical' },
      { id: 'llms-txt-valid', tier: 'medium' },
      { id: 'llms-txt-size', tier: 'high' },
      { id: 'llms-txt-links-resolve', tier: 'high' },
      { id: 'llms-txt-links-markdown', tier: 'high' },
      { id: 'llms-txt-directive-html', tier: 'high' },
      { id: 'llms-txt-directive-md', tier: 'medium' },
    ],
  },
  {
    id: 'markdown-availability',
    name: 'Markdown Availability',
    rationale: 'Markdown is what agents read best. Serving it directly skips a lossy HTML conversion.',
    checks: [
      { id: 'markdown-url-support', tier: 'high' },
      { id: 'content-negotiation', tier: 'medium' },
    ],
  },
  {
    id: 'page-size',
    name: 'Page Size and Truncation Risk',
    rationale: 'Agents truncate long pages. Server-rendered, compact pages keep the content inside the window.',
    checks: [
      { id: 'rendering-strategy', tier: 'critical' },
      { id: 'page-size-markdown', tier: 'high' },
      { id: 'page-size-html', tier: 'high' },
      { id: 'page-size-transfer', tier: 'medium' },
      { id: 'content-start-position', tier: 'medium' },
      { id: 'single-fetch-completeness', tier: 'medium' },
    ],
  },
  {
    id: 'content-structure',
    name: 'Content Structure',
    rationale: 'Tabs, code fences, tables, and links have to survive serialization so agents read what people see.',
    checks: [
      { id: 'tabbed-content-serialization', tier: 'medium' },
      { id: 'section-header-quality', tier: 'low' },
      { id: 'markdown-code-fence-validity', tier: 'medium' },
      { id: 'markdown-link-portability', tier: 'medium' },
      { id: 'embedded-data-serialization', tier: 'medium' },
    ],
  },
  {
    id: 'url-stability',
    name: 'URL Stability and Redirects',
    rationale: 'Real status codes and same-host redirects keep agents from citing dead or wrong pages.',
    checks: [
      { id: 'http-status-codes', tier: 'high' },
      { id: 'redirect-behavior', tier: 'medium' },
    ],
  },
  {
    id: 'observability',
    name: 'Observability and Content Health',
    rationale: 'Coverage, parity, and cache headers decide whether what an agent retrieves is complete and current.',
    checks: [
      { id: 'llms-txt-coverage', tier: 'medium' },
      { id: 'markdown-content-parity', tier: 'medium' },
      { id: 'cache-header-hygiene', tier: 'low' },
    ],
  },
  {
    id: 'authentication',
    name: 'Authentication and Access',
    rationale: 'Docs behind a login or a bot wall are invisible to agents unless there is another way in.',
    checks: [
      { id: 'auth-gate-detection', tier: 'critical' },
      { id: 'auth-alternative-access', tier: 'medium' },
      { id: 'bot-protection-interference', tier: 'high' },
    ],
  },
];

export const TOTAL_CHECKS = CATEGORIES.reduce((sum, category) => sum + category.checks.length, 0);

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export const CHECK_NAMES: Record<string, string> = {
  'llms-txt-exists': 'llms.txt exists',
  'llms-txt-valid': 'llms.txt structure',
  'llms-txt-size': 'llms.txt size',
  'llms-txt-links-resolve': 'llms.txt links resolve',
  'llms-txt-links-markdown': 'llms.txt links point to markdown',
  'llms-txt-directive-html': 'llms.txt directive in HTML',
  'llms-txt-directive-md': 'llms.txt directive in markdown',
  'markdown-url-support': '.md URL support',
  'content-negotiation': 'Content negotiation',
  'rendering-strategy': 'Server-rendered content',
  'page-size-markdown': 'Markdown page size',
  'page-size-html': 'HTML page size',
  'page-size-transfer': 'Transfer size',
  'content-start-position': 'Content start position',
  'single-fetch-completeness': 'Single-fetch completeness',
  'tabbed-content-serialization': 'Tabbed content serialization',
  'section-header-quality': 'Section header quality',
  'markdown-code-fence-validity': 'Code fence validity',
  'markdown-link-portability': 'Markdown link portability',
  'embedded-data-serialization': 'Embedded data serialization',
  'http-status-codes': 'HTTP status codes',
  'redirect-behavior': 'Redirect behavior',
  'llms-txt-coverage': 'llms.txt coverage',
  'markdown-content-parity': 'Markdown and HTML parity',
  'cache-header-hygiene': 'Cache header hygiene',
  'auth-gate-detection': 'Auth gate detection',
  'auth-alternative-access': 'Alternative access paths',
  'bot-protection-interference': 'Bot protection interference',
};

export function getCategoryMeta(id: string): CategoryMeta | undefined {
  return CATEGORY_BY_ID.get(id);
}

export function categoryName(id: string, fallback?: string | null): string {
  return fallback || CATEGORY_BY_ID.get(id)?.name || id;
}

/** Prefer the backend name unless it is just the id echoed back. */
export function checkName(id: string, fallback?: string | null): string {
  if (fallback && fallback !== id) return fallback;
  return CHECK_NAMES[id] ?? id;
}

export function tierCounts(category: CategoryMeta): Array<{ tier: CheckTier; count: number }> {
  const order: CheckTier[] = ['critical', 'high', 'medium', 'low'];
  return order
    .map((tier) => ({ tier, count: category.checks.filter((check) => check.tier === tier).length }))
    .filter((entry) => entry.count > 0);
}

// --- Grades ---------------------------------------------------------------

export type GradeTone = 'a' | 'b' | 'c' | 'd' | 'f' | 'none';

export function gradeTone(grade: Grade | string | null | undefined): GradeTone {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'a';
    case 'B':
      return 'b';
    case 'C':
      return 'c';
    case 'D':
      return 'd';
    case 'F':
      return 'f';
    default:
      return 'none';
  }
}

/** afdocs grade bands (scoring 0.2.0). */
export function gradeForScore(score: number | null | undefined): Grade | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 100) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Hex colors per grade tone, for places CSS variables cannot reach (the OG
 * image renderer). Keep in step with the --pl-as-grade-* tokens in site.css.
 */
export const GRADE_HEX: Record<GradeTone, string> = {
  a: '#4fd69c',
  b: '#a3d955',
  c: '#f5c451',
  d: '#fb9a5b',
  f: '#f87171',
  none: '#747987',
};

export const GRADE_LABEL: Record<GradeTone, string> = {
  a: 'Excellent',
  b: 'Good',
  c: 'Improving',
  d: 'Needs work',
  f: 'Not agent-ready',
  none: 'Unscored',
};

export const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail',
  skip: 'Skipped',
  error: 'Error',
};

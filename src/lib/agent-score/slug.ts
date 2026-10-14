/**
 * Site key / slug rules from the Agent Score API contract.
 *
 * A slug is `host` + optional path (`docs.stripe.com`, `stripe.com/docs`). The
 * host is lowercased; paths are case-sensitive and keep their case. These
 * helpers run both server-side (route params) and in the browser (the scan
 * form), so they must stay dependency-free.
 */

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const PATH_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;
const MAX_PATH_SEGMENTS = 4;
const MAX_SLUG_LENGTH = 200;
const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost'];

export type SlugParseResult =
  | { ok: true; slug: string; host: string; segments: string[] }
  | { ok: false; reason: string };

function validateParts(host: string, segments: string[]): SlugParseResult {
  if (!HOST_PATTERN.test(host)) {
    return { ok: false, reason: 'Enter a public hostname, like docs.example.com.' };
  }
  if (/^\d+(\.\d+){3}$/.test(host)) {
    return { ok: false, reason: 'Enter a hostname rather than an IP address.' };
  }
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: false, reason: 'Enter a public hostname, like docs.example.com.' };
  }
  if (segments.length > MAX_PATH_SEGMENTS) {
    return { ok: false, reason: `Paths can have at most ${MAX_PATH_SEGMENTS} segments.` };
  }
  if (segments.some((segment) => !PATH_SEGMENT_PATTERN.test(segment) || segment === '.' || segment === '..')) {
    return { ok: false, reason: 'The path can only use letters, numbers, and . _ ~ -' };
  }
  const slug = [host, ...segments].join('/');
  if (slug.length > MAX_SLUG_LENGTH) {
    return { ok: false, reason: 'That URL is too long.' };
  }
  return { ok: true, slug, host, segments };
}

/**
 * Parse the `[...site]` route param (or any slug string) into a canonical slug.
 * The host is lowercased, empty segments and a trailing slash are dropped.
 */
export function parseSlug(raw: string | undefined | null): SlugParseResult {
  if (!raw) return { ok: false, reason: 'Missing site.' };
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return { ok: false, reason: 'That address is not valid.' };
  }
  const parts = decoded.split('/').filter(Boolean);
  const host = (parts.shift() ?? '').toLowerCase();
  return validateParts(host, parts);
}

export interface NormalizedTarget {
  slug: string;
  /** URL to submit to the API: scheme + host + path, no query or fragment. */
  url: string;
}

/**
 * Normalize what a visitor typed into the scan form. Accepts bare hosts
 * (`docs.example.com`) as well as full http(s) URLs. Mirrors the backend's
 * normalization so the client can show validation errors before a round trip;
 * the backend remains the authority.
 */
export function normalizeTargetUrl(input: string): { ok: true; value: NormalizedTarget } | { ok: false; reason: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: 'Enter the URL of a docs site.' };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: 'That does not look like a URL. Try https://docs.example.com.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs can be scanned.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'Remove the username and password from the URL.' };
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { ok: false, reason: 'Only the standard ports (80 and 443) can be scanned.' };
  }
  const segments = parsed.pathname.split('/').filter(Boolean);
  const result = validateParts(parsed.hostname.toLowerCase(), segments);
  if (!result.ok) return result;
  const path = segments.length ? `/${segments.join('/')}` : '';
  return { ok: true, value: { slug: result.slug, url: `${parsed.protocol}//${result.host}${path}` } };
}

/** Public score page path for a slug. */
export function scorePagePath(slug: string): string {
  return `/agent-score/${slug}`;
}

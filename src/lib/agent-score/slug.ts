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

/**
 * Why a typed URL was rejected. `custom_port` gets a longer explanation in the
 * form, with links to afdocs and support; everything else shows `reason` as is.
 */
export type RejectionCode = 'custom_port' | 'invalid';

export type NormalizeTargetResult = { ok: true; value: NormalizedTarget } | { ok: false; code: RejectionCode; reason: string };

export const CUSTOM_PORT_REASON = 'Agent Score only scans sites on the standard https and http ports.';

/** True when the authority part of a URL names a port, even an empty or default one such as `:443`. */
function hasExplicitPort(withScheme: string): boolean {
  const authority = withScheme.slice(withScheme.indexOf('://') + 3).split(/[/?#]/, 1)[0];
  const hostAndPort = authority.slice(authority.lastIndexOf('@') + 1);
  return hostAndPort.slice(hostAndPort.lastIndexOf(']') + 1).includes(':');
}

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
 * the backend remains the authority. Any explicit port is rejected, `:443`
 * included: the hosted scanner only opens the standard ports.
 */
export function normalizeTargetUrl(input: string): NormalizeTargetResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, code: 'invalid', reason: 'Enter the URL of a docs site.' };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, code: 'invalid', reason: 'That does not look like a URL. Try https://docs.example.com.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, code: 'invalid', reason: 'Only http and https URLs can be scanned.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, code: 'invalid', reason: 'Remove the username and password from the URL.' };
  }
  if (hasExplicitPort(withScheme)) {
    return { ok: false, code: 'custom_port', reason: CUSTOM_PORT_REASON };
  }
  const segments = parsed.pathname.split('/').filter(Boolean);
  const result = validateParts(parsed.hostname.toLowerCase(), segments);
  if (!result.ok) return { ok: false, code: 'invalid', reason: result.reason };
  const path = segments.length ? `/${segments.join('/')}` : '';
  return { ok: true, value: { slug: result.slug, url: `${parsed.protocol}//${result.host}${path}` } };
}

/** Public score page path for a slug. */
export function scorePagePath(slug: string): string {
  return `/agent-score/${slug}`;
}

/**
 * Server-side Agent Score API client, used by the on-demand score page, its
 * markdown twin, and its OG image route.
 */
import { getAgentScoreApiBase } from './config';
import type { LeaderboardResponse, SiteResponse } from './types';

export type SiteFetchResult =
  | { kind: 'ok'; site: SiteResponse }
  | { kind: 'not_found' }
  | { kind: 'error'; status: number; message: string };

const FETCH_TIMEOUT_MS = 8_000;

function siteApiUrl(slug: string): string {
  // Slugs contain `/` between path segments; keep them literal so the backend
  // route `/sites/{slug:path}` sees the same path the page was requested with.
  const encoded = slug.split('/').map(encodeURIComponent).join('/');
  return `${getAgentScoreApiBase()}/sites/${encoded}`;
}

export function getSiteJsonUrl(slug: string, base = getAgentScoreApiBase()): string {
  return `${base}/sites/${slug}`;
}

export function getBadgeUrl(slug: string, base = getAgentScoreApiBase()): string {
  return `${base}/sites/${slug}/badge.svg`;
}

/** Latest completed scan per site, or `null` when the API is unavailable. */
export async function fetchLeaderboard(sort: 'top' | 'recent' = 'top', limit = 100): Promise<LeaderboardResponse | null> {
  try {
    const response = await fetch(`${getAgentScoreApiBase()}/leaderboard?sort=${sort}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.json()) as LeaderboardResponse;
  } catch {
    return null;
  }
}

export async function fetchSite(slug: string): Promise<SiteFetchResult> {
  try {
    const response = await fetch(siteApiUrl(slug), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 404) return { kind: 'not_found' };
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      return { kind: 'error', status: response.status, message: body.message || `The scoring service returned ${response.status}.` };
    }
    const site = (await response.json()) as SiteResponse;
    if (!site?.latest) return { kind: 'not_found' };
    return { kind: 'ok', site };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      kind: 'error',
      status: 503,
      message: timedOut ? 'The scoring service took too long to respond.' : 'The scoring service is unreachable right now.',
    };
  }
}

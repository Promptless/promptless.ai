/**
 * Agent Score API base URL. Same resolution as BrokenLinkReportForm.astro:
 * PUBLIC_FREE_TOOLS_API_BASE_URL wins, else production uses
 * https://api.gopromptless.ai and dev uses a local backend (or the mock from
 * `npm run dev:agent-score-mock`) on port 5000.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.PUBLIC_FREE_TOOLS_API_BASE_URL?.trim();
  const fallback = import.meta.env.PROD ? 'https://api.gopromptless.ai' : 'http://127.0.0.1:5000';
  return (raw || fallback).replace(/\/+$/, '');
}

export const AGENT_SCORE_API_PATH = '/public/free-tools/agent-score';

/** Base for every Agent Score endpoint, e.g. `${base}/sites/docs.stripe.com`. */
export function getAgentScoreApiBase(): string {
  return `${getApiBaseUrl()}${AGENT_SCORE_API_PATH}`;
}

/** Public badge and JSON URLs always point at production so embeds work anywhere. */
export const PUBLIC_AGENT_SCORE_API_BASE = `https://api.gopromptless.ai${AGENT_SCORE_API_PATH}`;
export const PUBLIC_SITE_ORIGIN = 'https://promptless.ai';

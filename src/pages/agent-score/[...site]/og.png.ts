/**
 * Per-site social card: /agent-score/<slug>/og.png, rendered on demand.
 * Unscored or invalid sites fall back to the static landing card.
 */
import type { APIRoute } from 'astro';
import { fetchSite } from '@lib/agent-score/api';
import { renderAgentScoreCard } from '@lib/agent-score/og';
import { parseSlug } from '@lib/agent-score/slug';

export const prerender = false;

export const GET: APIRoute = async ({ params, redirect }) => {
  const parsed = parseSlug(params.site);
  if (!parsed.ok) return redirect('/og/agent-score.png', 302);
  const result = await fetchSite(parsed.slug);
  if (result.kind !== 'ok') return redirect('/og/agent-score.png', 302);
  try {
    const png = await renderAgentScoreCard(result.site);
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        // The page links this with ?v=<scanId>, so a new scan gets a new URL.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[agent-score] OG render failed', error);
    return redirect('/og/agent-score.png', 302);
  }
};

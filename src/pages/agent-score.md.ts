/**
 * Agent-readable twin of /agent-score ("Agent mode"): the landing page content
 * followed by the live leaderboard, one line per scored site linking to that
 * site's markdown report. Rendered on demand so the list is current.
 */
import type { APIRoute } from 'astro';
import { fetchLeaderboard } from '@lib/agent-score/api';
import { getWebsiteMarkdownDocument } from '@lib/website-markdown';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.href ?? 'https://promptless.ai/').replace(/\/+$/, '');
  const entry = await getWebsiteMarkdownDocument('/agent-score');
  if (!entry) return new Response('Not found', { status: 404 });

  const lines = [`# ${entry.title}`, '', '> For the complete documentation index, see [llms.txt](/llms.txt).'];
  if (entry.description) lines.push('', entry.description);
  if (entry.body) lines.push('', entry.body);

  const leaderboard = await fetchLeaderboard('top', 100);
  lines.push('', '## Leaderboard', '');
  if (!leaderboard) {
    lines.push('The leaderboard is unavailable right now. Try again in a minute.');
  } else if (leaderboard.entries.length === 0) {
    lines.push(`No sites have been scored yet. Score one at ${origin}/agent-score.`);
  } else {
    lines.push(
      `Latest completed scan per site, highest score first. ${leaderboard.totalSites} sites scored.`,
      '',
      ...leaderboard.entries.map(
        (row) => {
          const label = row.displayName && row.displayName !== row.slug ? `${row.displayName} (${row.slug})` : row.slug;
          return `- [${label}](/agent-score/${row.slug}.md) — ${row.overall}/100 (${row.grade})`;
        },
      ),
    );
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
};

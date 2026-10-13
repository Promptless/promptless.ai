/**
 * Agent-readable twin of /agent-score/<slug>: the same report as markdown
 * ("Agent mode"). Rendered on demand like the HTML page.
 */
import type { APIRoute } from 'astro';
import { fetchSite, getBadgeUrl, getSiteJsonUrl } from '@lib/agent-score/api';
import { PUBLIC_AGENT_SCORE_API_BASE } from '@lib/agent-score/config';
import { buildMarkdownReport } from '@lib/agent-score/report';
import { parseSlug, scorePagePath } from '@lib/agent-score/slug';

export const prerender = false;

const markdown = (body: string, status = 200, cache = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300') =>
  new Response(body, { status, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': cache } });

export const GET: APIRoute = async ({ params, site }) => {
  const origin = (site?.href ?? 'https://promptless.ai/').replace(/\/+$/, '');
  const parsed = parseSlug(params.site);
  if (!parsed.ok) {
    return markdown(`# Agent Score\n\n${parsed.reason}\n\nScore a docs site at ${origin}/agent-score.\n`, 404, 'no-store');
  }
  const result = await fetchSite(parsed.slug);
  if (result.kind === 'not_found') {
    return markdown(
      [
        `# Agent Score: ${parsed.slug}`,
        '',
        `${parsed.slug} has not been scored yet.`,
        '',
        `Start a scan by sending \`POST ${PUBLIC_AGENT_SCORE_API_BASE}/scans\` with the JSON body \`{"url": "https://${parsed.slug}"}\`, then poll \`GET ${PUBLIC_AGENT_SCORE_API_BASE}/scans/<scanId>\` every few seconds until \`status\` is \`complete\`. A person can also open ${origin}${scorePagePath(parsed.slug)} and select Score it now.`,
        '',
        `To score it locally instead, run \`npx afdocs@latest check https://${parsed.slug} --format scorecard\`.`,
        '',
      ].join('\n'),
      404,
      'no-store',
    );
  }
  if (result.kind === 'error') {
    return markdown(`# Agent Score: ${parsed.slug}\n\n${result.message} Try again in a minute.\n`, 503, 'no-store');
  }
  const { slug } = result.site;
  const body = buildMarkdownReport(result.site, {
    pageUrl: `${origin}${scorePagePath(slug)}`,
    jsonUrl: getSiteJsonUrl(slug, PUBLIC_AGENT_SCORE_API_BASE),
    badgeUrl: getBadgeUrl(slug, PUBLIC_AGENT_SCORE_API_BASE),
    automateUrl: `${origin}/agent-score#automate`,
  });
  return markdown(`${body}\n`);
};

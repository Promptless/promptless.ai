import type { APIRoute } from 'astro';
import { groupRoutes, llmsIndexResponse, routeLink, visibleRoutes, type LlmsSection } from '@lib/llms-index';
import type { RouteManifestEntry } from '@lib/route-manifest';

// Nested llms.txt index of every documentation page, grouped by sidebar
// section in nav order. The marketing-images, media-kit, and referral-program
// pages are site assets, not product documentation, so they stay out.

export const prerender = true;

const NOTE = 'The site index is at https://promptless.ai/llms.txt. Append `.md` to any page URL (or send `Accept: text/markdown`) to get its markdown twin.';

const NON_PRODUCT_DOCS = ['/docs/marketing-images', '/docs/media-kit', '/docs/referral-program'];

const AGENT_INSTRUCTIONS_PREFIX = '/docs/governance';

function sectionsFor(entries: RouteManifestEntry[]): LlmsSection[] {
  return [...groupRoutes(entries, (entry) => entry.section ?? 'Other').entries()].map(([heading, routes]) => ({
    heading,
    links: routes.map((entry) => routeLink(entry)),
  }));
}

export const GET: APIRoute = async ({ site }) => {
  const docs = visibleRoutes('docs').filter(
    (entry) => !NON_PRODUCT_DOCS.some((prefix) => entry.routePath.startsWith(prefix)),
  );
  // Promptless for Docs sections first, then Promptless for Agent Instructions.
  const forDocs = docs.filter((entry) => !entry.routePath.startsWith(AGENT_INSTRUCTIONS_PREFIX));
  const agentInstructions = docs.filter((entry) => entry.routePath.startsWith(AGENT_INSTRUCTIONS_PREFIX));
  const sections = [...sectionsFor(forDocs), ...sectionsFor(agentInstructions)];

  return llmsIndexResponse(
    {
      title: 'Promptless documentation',
      blurb:
        'Every page of the Promptless documentation, Promptless for Docs and Promptless for Agent Instructions, with its markdown twin.',
      note: NOTE,
      sections,
    },
    site,
  );
};

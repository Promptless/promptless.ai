import type { APIRoute } from 'astro';
import { llmsIndexResponse, routeLink, visibleRoutes } from '@lib/llms-index';

// Nested llms.txt index of every changelog entry, newest first.

export const prerender = true;

export const GET: APIRoute = async ({ site }) =>
  llmsIndexResponse(
    {
      title: 'Promptless changelog',
      blurb:
        'Every monthly changelog entry with its markdown twin. The site index is at https://promptless.ai/llms.txt.',
      sections: [{ heading: 'Entries', links: visibleRoutes('changelog').map((entry) => routeLink(entry)) }],
    },
    site,
  );

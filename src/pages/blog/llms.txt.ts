import type { APIRoute } from 'astro';
import { groupRoutes, llmsIndexResponse, routeLink, visibleRoutes } from '@lib/llms-index';

// Nested llms.txt index of every blog post, grouped by category.

export const prerender = true;

const CATEGORY_LABELS: Record<string, string> = {
  'customer-stories': 'Customer stories',
  'product-updates': 'Product updates',
  newsletter: 'Newsletter',
  technical: 'Technical',
  'life-at-promptless': 'Life at Promptless',
};

function categoryOf(routePath: string): string {
  const slug = routePath.split('/')[2] ?? '';
  return CATEGORY_LABELS[slug] ?? slug;
}

export const GET: APIRoute = async ({ site }) => {
  const sections = [...groupRoutes(visibleRoutes('blog'), (entry) => categoryOf(entry.routePath)).entries()].map(
    ([heading, entries]) => ({ heading, links: entries.map((entry) => routeLink(entry)) }),
  );

  return llmsIndexResponse(
    {
      title: 'Promptless blog',
      blurb:
        'Every post on the Promptless blog with its markdown twin: product updates, technical writing, and customer stories. The site index is at https://promptless.ai/llms.txt.',
      sections,
    },
    site,
  );
};

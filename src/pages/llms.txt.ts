import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortByManifestOrder } from '@lib/content-order';
import { toAbsoluteUrl } from '@lib/canonical-site';
import type { RouteManifestEntry } from '@lib/route-manifest';

interface WebsiteEntry {
  title: string;
  description?: string;
  routePath: string;
  order: number;
}

export const GET: APIRoute = async ({ site }) => {
  const websiteEntries = await getWebsiteEntries();
  const lines: string[] = [
    '# Promptless | Documentation',
    '',
    '> Promptless automatically updates your customer-facing docs as you ship features and support customers. This index lists all documentation, blog posts, and changelogs.',
    '',
    '## Website',
    '',
  ];

  for (const entry of websiteEntries) {
    lines.push(
      `- [${entry.title}](${toAbsoluteUrl(entry.routePath, site)})${entry.description ? `: ${entry.description}` : ''}`
    );
  }

  lines.push('', '## Docs', '');
  for (const route of sortByManifestOrder('docs')) {
    if (route.hidden) continue;
    lines.push(
      `- [${route.title}](${toAbsoluteUrl(route.routePath, site)})${route.description ? `: ${route.description}` : ''}`
    );
  }

  lines.push('', '## Blog', '');
  for (const route of sortByDescendingDate(sortByManifestOrder('blog'))) {
    if (route.hidden) continue;
    lines.push(
      `- [${route.title}](${toAbsoluteUrl(route.routePath, site)})${route.description ? `: ${route.description}` : ''}`
    );
  }

  lines.push('', '## Changelog', '');
  for (const route of sortByDescendingDate(sortByManifestOrder('changelog'))) {
    if (route.hidden) continue;
    lines.push(`- [${route.title}](${toAbsoluteUrl(route.routePath, site)})`);
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

async function getWebsiteEntries(): Promise<WebsiteEntry[]> {
  const entries = await getCollection('website', ({ data }) => !data.hidden);
  return entries
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      routePath: entry.data.routePath,
      order: entry.data.order,
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.routePath.localeCompare(b.routePath);
    });
}

function sortByDescendingDate(entries: RouteManifestEntry[]) {
  return entries.slice().sort((a, b) => {
    const aDate = a.date || '';
    const bDate = b.date || '';
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    if (a.order !== b.order) return a.order - b.order;
    return a.routePath.localeCompare(b.routePath);
  });
}

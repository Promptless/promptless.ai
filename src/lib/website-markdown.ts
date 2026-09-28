import { getCollection } from 'astro:content';

interface WebsiteMarkdownDocument {
  title: string;
  description?: string;
  routePath: string;
  body: string;
}

let websiteMarkdownByRoutePromise: Promise<Map<string, WebsiteMarkdownDocument>> | undefined;

function normalizeRoutePath(routePath: string): string {
  const normalized = routePath.trim();
  if (!normalized || normalized === '/') return '/';
  return normalized.startsWith('/') ? normalized.replace(/\/+$/, '') : `/${normalized.replace(/\/+$/, '')}`;
}

async function getWebsiteMarkdownByRoute(): Promise<Map<string, WebsiteMarkdownDocument>> {
  websiteMarkdownByRoutePromise ??= (async () => {
    const entries = await getCollection('websiteMarkdown', ({ data }) => !data.hidden);
    const byRoute = new Map<string, WebsiteMarkdownDocument>();

    for (const entry of entries) {
      byRoute.set(normalizeRoutePath(entry.data.routePath), {
        title: entry.data.title,
        description: entry.data.description,
        routePath: normalizeRoutePath(entry.data.routePath),
        body: (entry.body ?? '').trim(),
      });
    }

    return byRoute;
  })();

  return websiteMarkdownByRoutePromise;
}

export async function getWebsiteMarkdownDocument(routePath: string) {
  const byRoute = await getWebsiteMarkdownByRoute();
  return byRoute.get(normalizeRoutePath(routePath));
}

interface WebsiteMarkdownResponseOptions {
  // Rewrites the body before it is served, for sections generated from content
  // collections (for example, the customer story list on /customers.md).
  transformBody?: (body: string) => string | Promise<string>;
}

export async function createWebsiteMarkdownResponse(
  routePath: string,
  options: WebsiteMarkdownResponseOptions = {},
) {
  const entry = await getWebsiteMarkdownDocument(routePath);
  if (!entry) return new Response('Not found', { status: 404 });

  const body = options.transformBody ? await options.transformBody(entry.body) : entry.body;

  const lines = [`# ${entry.title}`];
  lines.push('', '> For the complete documentation index, see [llms.txt](/llms.txt).');
  if (entry.description) lines.push('', entry.description);
  if (body) lines.push('', body);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

import { routeEntries } from '@lib/content-order';
import type { RouteManifestEntry } from '@lib/route-manifest';
import { getWebsiteMarkdownDocument } from '@lib/website-markdown';

// Shared building blocks for the llms.txt indexes (/llms.txt and the nested
// /docs, /blog, and /changelog indexes), modeled on mintlify.com/llms.txt: a
// title, a one-paragraph blurb, then sections of `- [label](url): description`
// lines that point at markdown twins. Page titles and descriptions resolve from
// the route manifest or the websiteMarkdown collection, so a renamed or hidden
// page fails the build instead of leaving a stale link.

export interface LlmsLink {
  label: string;
  url: string;
  description?: string;
}

export interface LlmsSection {
  heading: string;
  intro?: string;
  links: LlmsLink[];
}

export interface LlmsIndex {
  title: string;
  blurb: string;
  sections: LlmsSection[];
}

interface LinkOverrides {
  label?: string;
  description?: string;
}

export function routeLink(entry: RouteManifestEntry, overrides: LinkOverrides = {}): LlmsLink {
  return {
    label: overrides.label ?? entry.title,
    url: `${entry.routePath}.md`,
    description: overrides.description ?? entry.description,
  };
}

export function docsPage(routePath: string, overrides: LinkOverrides = {}): LlmsLink {
  const entry = routeEntries.find((route) => route.routePath === routePath && !route.hidden);
  if (!entry) throw new Error(`llms.txt links to an unknown or hidden route: ${routePath}`);
  return routeLink(entry, overrides);
}

export async function marketingPage(routePath: string, overrides: LinkOverrides = {}): Promise<LlmsLink> {
  const entry = await getWebsiteMarkdownDocument(routePath);
  if (!entry) throw new Error(`llms.txt links to an unknown marketing page: ${routePath}`);
  return {
    label: overrides.label ?? entry.title,
    url: routePath === '/' ? '/index.md' : `${routePath}.md`,
    description: overrides.description ?? entry.description,
  };
}

export function link(label: string, url: string, description?: string): LlmsLink {
  return { label, url, description };
}

/** Visible routes of one content type, in manifest order. */
export function visibleRoutes(contentType: RouteManifestEntry['contentType']): RouteManifestEntry[] {
  return routeEntries.filter((entry) => entry.contentType === contentType && !entry.hidden);
}

/** Groups entries by a key, keeping the order in which each key first appears. */
export function groupRoutes(
  entries: RouteManifestEntry[],
  keyOf: (entry: RouteManifestEntry) => string,
): Map<string, RouteManifestEntry[]> {
  const groups = new Map<string, RouteManifestEntry[]>();
  for (const entry of entries) {
    const key = keyOf(entry);
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  return groups;
}

export function renderLlmsIndex(index: LlmsIndex, site: URL): string {
  const lines = [`# ${index.title}`, '', `> ${index.blurb}`];
  for (const section of index.sections) {
    lines.push('', `## ${section.heading}`, '');
    if (section.intro) lines.push(section.intro, '');
    for (const entry of section.links) {
      const url = new URL(entry.url, site).href;
      lines.push(`- [${entry.label}](${url})${entry.description ? `: ${entry.description}` : ''}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function llmsIndexResponse(index: LlmsIndex, site: URL | undefined): Response {
  if (!site) throw new Error('`site` must be set in the Astro configuration to build llms.txt indexes');
  return new Response(renderLlmsIndex(index, site), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

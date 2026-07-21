// Rehype plugin: open links that point at the Promptless app in a new tab.
//
// Docs prose links to the app (app.gopromptless.ai) are plain Markdown
// `[text](url)` links, which render as same-tab `<a href>` — so clicking one
// (e.g. "open the Configuration page") navigates the reader away from the docs
// and loses their place. This plugin runs over every Markdown/MDX doc at build
// time and rewrites app links to open in a new tab, adding
// `rel="noopener noreferrer"` for the usual security/perf hygiene. Handling it
// centrally in the pipeline (rather than per-link in the Markdown) covers every
// current app link and any added later without authors remembering to opt in.

import type { Root, Element, ElementContent } from 'hast';

// Hosts that resolve to the Promptless app dashboard. Links here are the ones
// Prithvi asked to open in a new tab; other external links (github.com, etc.)
// are intentionally left alone.
const APP_HOSTS = new Set(['app.gopromptless.ai', 'app.promptless.ai']);

function hostOf(href: string): string | null {
  try {
    // Base lets us ignore root-relative/relative hrefs (they throw or resolve
    // to the docs origin, never an app host).
    return new URL(href, 'https://promptless.ai').hostname.toLowerCase();
  } catch {
    return null;
  }
}

function mergeRel(existing: unknown): string {
  const tokens = new Set<string>();
  if (typeof existing === 'string') {
    for (const t of existing.split(/\s+/)) if (t) tokens.add(t);
  } else if (Array.isArray(existing)) {
    for (const t of existing) if (typeof t === 'string' && t) tokens.add(t);
  }
  tokens.add('noopener');
  tokens.add('noreferrer');
  return [...tokens].join(' ');
}

function isAppAnchor(node: Element): boolean {
  if (node.tagName !== 'a') return false;
  const href = node.properties?.href;
  if (typeof href !== 'string') return false;
  const host = hostOf(href);
  return host !== null && APP_HOSTS.has(host);
}

function walk(node: Root | ElementContent): void {
  if (node.type === 'element') {
    if (isAppAnchor(node)) {
      node.properties = node.properties ?? {};
      node.properties.target = '_blank';
      node.properties.rel = mergeRel(node.properties.rel);
    }
  }
  const children = (node as Root | Element).children;
  if (Array.isArray(children)) {
    for (const child of children) walk(child as ElementContent);
  }
}

export default function rehypeAppLinksNewTab() {
  return (tree: Root): void => {
    walk(tree);
  };
}

/**
 * Single source of truth for which pages get a generated social card, and the
 * title / description / eyebrow each card is built from.
 *
 * Both sides of the feature read this list:
 *   - scripts/generate-og-images.ts — incrementally generates one PNG per entry.
 *   - src/components/starlight/Head.astro — points each page's og:image at its
 *     pre-generated card by matching the current pathname to an entry here.
 *
 * Keeping enumeration in one place means the generator and the meta tags can
 * never drift out of sync (a card with no meta tag, or a meta tag with no card).
 */

import routeManifest from '../generated/route-manifest.json' with { type: 'json' };
import type { RouteManifestEntry } from '../route-manifest';

export interface OgPage {
  /**
   * The og-card slug: the site path without its leading slash. The root path
   * maps to the reserved slug "index". This is the `[...slug]` value the image
   * endpoint renders to `/og/<slug>.png`.
   */
  slug: string;
  /** Site path this card belongs to, normalized without a trailing slash (root is "/"). */
  routePath: string;
  title: string;
  description?: string;
  /** Small label above the title, from the page's content type. */
  eyebrow?: string;
}

const EYEBROW: Record<string, string> = {
  docs: 'Documentation',
  blog: 'Blog',
  changelog: 'Changelog',
};

/** Normalize a site path so map lookups are stable: no trailing slash, root stays "/". */
export function normalizeRoutePath(pathname: string): string {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Convert a normalized site path to its og-card slug. */
function routePathToSlug(routePath: string): string {
  return routePath === '/' ? 'index' : routePath.replace(/^\/+/, '');
}

// Standalone marketing / site pages. These render through StarlightPage but are
// not in the content-driven route manifest (which covers docs/blog/changelog
// only), so they are listed explicitly here. Titles/descriptions mirror what
// each page passes to StarlightPage today.
const STANDALONE_PAGES: Array<{ routePath: string; title: string; description?: string }> = [
  {
    routePath: '/',
    title: 'Promptless improves your docs and AI workforce automatically.',
    description: 'It eliminates drift in the docs and instructions your teams and their agents rely on.',
  },
  {
    routePath: '/pricing',
    title: 'Pricing that fits teams of all sizes',
    description: 'Plans for teams that want docs-native automation.',
  },
  {
    routePath: '/free-tools',
    title: 'Free tools',
    description: 'Free tools to help you quickly improve docs quality.',
  },
];

function buildPages(): OgPage[] {
  const entries: OgPage[] = [];
  const seen = new Set<string>();

  const add = (routePath: string, title: string, description?: string, eyebrow?: string) => {
    const normalized = normalizeRoutePath(routePath);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    entries.push({
      slug: routePathToSlug(normalized),
      routePath: normalized,
      title,
      description,
      eyebrow,
    });
  };

  // Standalone marketing pages first so they own their routePath.
  for (const p of STANDALONE_PAGES) add(p.routePath, p.title, p.description);

  // Content-driven pages (docs, blog, changelog), skipping hidden ones — a
  // hidden page is excluded from the sitemap/nav, so it does not need a card.
  // Blog posts with an explicit socialImage already have a hand-authored card.
  for (const entry of routeManifest as RouteManifestEntry[]) {
    if (entry.hidden || entry.socialImage) continue;
    add(entry.routePath, entry.title, entry.description, EYEBROW[entry.contentType]);
  }

  return entries;
}

const PAGES = buildPages();
const BY_ROUTE = new Map(PAGES.map((p) => [p.routePath, p]));

/** Every page that gets a generated social card. */
export function getOgPages(): OgPage[] {
  return PAGES;
}

/** Look up the card for a site path, or undefined if the path has no generated card. */
export function getOgPageForPath(pathname: string): OgPage | undefined {
  return BY_ROUTE.get(normalizeRoutePath(pathname));
}

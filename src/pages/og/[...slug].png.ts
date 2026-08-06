/**
 * Build-time social-card endpoint: /og/<slug>.png
 *
 * One static PNG per page, generated at build from that page's title +
 * description (see src/lib/og/pages.ts for the enumeration and src/lib/og/card.ts
 * for the renderer). The site is `output: 'static'`, so `getStaticPaths` fully
 * enumerates the routes and each card is emitted as a static asset — no SSR.
 *
 * The matching og:image / twitter:image meta tags are injected per page by
 * src/components/starlight/Head.astro, which resolves the same slug from the
 * current pathname.
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgPages } from '@lib/og/pages';
import { renderOgCard } from '@lib/og/card';

export const getStaticPaths: GetStaticPaths = () =>
  getOgPages().map((page) => ({
    params: { slug: page.slug },
    props: { title: page.title, description: page.description, eyebrow: page.eyebrow },
  }));

export const GET: APIRoute = async ({ props }) => {
  const { title, description, eyebrow } = props as {
    title: string;
    description?: string;
    eyebrow?: string;
  };

  const png = await renderOgCard({ title, description, eyebrow });

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

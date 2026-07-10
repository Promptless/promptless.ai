import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLlmsTxt from 'starlight-llms-txt';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import vercel from '@astrojs/vercel';
import starlightMcp from './packages/starlight-mcp/src/index.ts';

import redirectsManifest from './src/lib/generated/redirects.json' with { type: 'json' };
import routeManifest from './src/lib/generated/route-manifest.json' with { type: 'json' };
import {
  createSitemapPathFilter,
  getHiddenDocsPaths,
  getHiddenRouteManifestPaths,
  getHiddenWebsitePaths,
} from './src/lib/sitemap-filter.mjs';

const redirectEntries = (redirectsManifest.redirects || []).map((rule) => [rule.source, rule.destination]);
const hiddenSitemapPaths = new Set([
  ...getHiddenRouteManifestPaths(routeManifest),
  ...getHiddenDocsPaths(new URL('./src/content/docs/', import.meta.url)),
  ...getHiddenWebsitePaths(new URL('./src/content/website/', import.meta.url)),
]);

// ---------------------------------------------------------------------------
// MCP server (packages/starlight-mcp, ported from the Starport template). The
// /mcp route is rendered on demand, so enabling it requires the @astrojs/vercel
// SSR adapter — the rest of the site stays static (output: 'static' +
// prerender: false on the MCP route only). Set MCP_ENABLED=false for a fully
// static, adapter-less build (e.g. if the adapter ever misbehaves in a deploy).
// ---------------------------------------------------------------------------
const MCP_ENABLED = process.env.MCP_ENABLED !== 'false';

const redirects = {
  '/home': '/',
  '/docs': '/docs/start-here/welcome',
  '/page': '/',
  '/wtd': '/',
  '/hn': '/',
  '/blog/customer-stories-vellum': '/blog/customer-stories/vellum',
  '/use-cases': '/',
  '/faq': '/',
  '/api-reference': '/api/',
  '/oss': '/docs/start-here/open-source-quickstart',
  '/media-kit': '/docs/media-kit',
  '/brand': '/docs/media-kit',
  '/blog/all': '/blog',
  '/changelog/all': '/changelog',
  ...Object.fromEntries(redirectEntries),
};

export default defineConfig({
  site: process.env.SITE_URL || 'https://promptless.ai',
  adapter: MCP_ENABLED ? vercel() : undefined,
  redirects,
  integrations: [
    react(),
    partytown({
      config: {
        forward: ['dataLayer.push', 'gtag'],
      },
    }),
    sitemap({
      filter: createSitemapPathFilter(hiddenSitemapPaths),
    }),
    starlight({
      title: 'Promptless | Automatic updates for your customer-facing docs',
      description: 'Automated docs that eliminate manual overhead and keep your docs current with your codebase',
      logo: {
        src: './public/assets/logo.svg',
        dark: './public/assets/logo_darkbg.svg',
        alt: 'Promptless',
        replacesTitle: true,
      },
      favicon: '/favicon.ico',
      customCss: ['./src/styles/custom.css', './src/styles/site.css'],
      plugins: [
        starlightOpenAPI([
          {
            base: 'api',
            schema: './public/openapi/api-triggers.yaml',
            sidebar: { label: 'API Reference', collapsed: true },
          },
        ]),
        // Agent-friendly llms.txt (Starport Phase 6, ADR 0004 §4). Adopts
        // `starlight-llms-txt`, retiring the hand-rolled src/pages/llms.txt.ts and
        // llms-full.txt.ts route endpoints (Manny, 2026-07-10: "use the plugin, not
        // my hand-rolled llms.txt"). The plugin generates /llms.txt, /llms-full.txt,
        // and a new /llms-small.txt from the Starlight docs tree at build time — no
        // SSR adapter needed, so the site stays fully static (MCP/SSR is deferred to
        // a later phase). The plugin is docs-scoped, so the non-docs surface the old
        // hand-rolled index also listed (marketing pages, blog, changelog) is
        // reconciled here via `optionalLinks` rather than a hand-rolled route. The
        // per-page `.md` endpoints ([...slug].md.ts, index.md.ts, pricing.md.ts,
        // free-tools.md.ts) are unrelated to the /llms*.txt routes and are kept.
        starlightLlmsTxt({
          projectName: 'Promptless',
          description:
            'Promptless automatically updates your customer-facing docs as you ship features and support customers.',
          optionalLinks: [
            { label: 'Blog', url: 'https://promptless.ai/blog', description: 'Product updates, technical writing, and customer stories' },
            { label: 'Changelog', url: 'https://promptless.ai/changelog', description: 'Monthly summaries of user-visible changes' },
            { label: 'Homepage (Markdown)', url: 'https://promptless.ai/index.md', description: 'Marketing overview of Promptless' },
            { label: 'Pricing (Markdown)', url: 'https://promptless.ai/pricing.md', description: 'Plans and pricing' },
            { label: 'Free tools (Markdown)', url: 'https://promptless.ai/free-tools.md', description: 'Free documentation tools' },
          ],
        }),
        // Folder-autogenerated docs nav (Starport Phase 3, ADR 0003). Replaces
        // the retired `generate:manifest` sidebar.json pipeline. A single topic
        // ("Documentation") wraps Starlight's native `autogenerate`, with each
        // group's `label` set explicitly to reproduce the exact current nav
        // labels/order (autogenerate would otherwise use the raw folder segment,
        // e.g. "context-sources"). Section index pages that sit beside a
        // like-named directory (Triggers, Context sources, Integrations) are
        // listed explicitly so they stay the first item in their group, matching
        // the previous output. Phase 5 (ADR 0004 §2) settled the topic model on
        // this single "Documentation" topic: no visible topic-switcher bar and no
        // separate "API Reference" topic, because the site surfaces one docs tree
        // today (the OpenAPI /api/* pages live inside this topic, not a separate
        // one). The repo's Sidebar override renders the sublist directly and never
        // mounts the plugin's <Topics/> switcher, so no topic bar renders — the
        // rendered nav is byte-for-byte identical to the pre-topics site.
        starlightSidebarTopics(
          [
            {
              id: 'docs',
              label: 'Documentation',
              link: '/docs/start-here/welcome',
              items: [
                { label: 'Start Here', collapsed: true, items: [{ autogenerate: { directory: 'docs/start-here', collapsed: true } }] },
                {
                  label: 'Connect',
                  collapsed: true,
                  items: [
                    {
                      label: 'Triggers',
                      collapsed: true,
                      items: [
                        { label: 'Triggers', slug: 'docs/connect/triggers' },
                        { autogenerate: { directory: 'docs/connect/triggers', collapsed: true } },
                      ],
                    },
                    {
                      label: 'Context sources',
                      collapsed: true,
                      items: [
                        { label: 'Context sources', slug: 'docs/connect/context-sources' },
                        { autogenerate: { directory: 'docs/connect/context-sources', collapsed: true } },
                      ],
                    },
                    { label: 'Doc locations', collapsed: true, items: [{ autogenerate: { directory: 'docs/connect/doc-locations', collapsed: true } }] },
                    { label: 'Source control', slug: 'docs/connect/source-control' },
                    { label: 'Connection health', slug: 'docs/connect/connection-health' },
                  ],
                },
                { label: 'Tune', collapsed: true, items: [{ autogenerate: { directory: 'docs/tune', collapsed: true } }] },
                { label: 'Work the queue', collapsed: true, items: [{ autogenerate: { directory: 'docs/work-the-queue', collapsed: true } }] },
                { label: 'Get the most out of it', collapsed: true, items: [{ autogenerate: { directory: 'docs/get-the-most-out', collapsed: true } }] },
                { label: 'Scale', collapsed: true, items: [{ autogenerate: { directory: 'docs/scale', collapsed: true } }] },
                { label: 'Audit', collapsed: true, items: [{ autogenerate: { directory: 'docs/audit', collapsed: true } }] },
                { label: 'Migrate', collapsed: true, items: [{ autogenerate: { directory: 'docs/migrate', collapsed: true } }] },
                { label: 'Security', collapsed: true, items: [{ autogenerate: { directory: 'docs/security', collapsed: true } }] },
                { label: 'Measure impact', collapsed: true, items: [{ autogenerate: { directory: 'docs/measure', collapsed: true } }] },
                {
                  label: 'Reference',
                  collapsed: true,
                  items: [
                    {
                      label: 'Integrations',
                      collapsed: true,
                      items: [
                        { label: 'Integrations', slug: 'docs/reference/integrations' },
                        { autogenerate: { directory: 'docs/reference/integrations', collapsed: true } },
                      ],
                    },
                    { label: 'Configuration reference', slug: 'docs/reference/configuration-reference' },
                    { label: 'Frequently asked questions', slug: 'docs/reference/faq' },
                    { label: 'Account management', slug: 'docs/reference/account-management' },
                    { label: 'Getting support', slug: 'docs/reference/getting-help' },
                  ],
                },
                ...openAPISidebarGroups,
              ],
            },
          ],
          {
            // Pages that render the docs sidebar but are not discovered by the
            // topic's `autogenerate` walk, associated with the docs topic so the
            // plugin can resolve them: the starlight-openapi reference pages, and
            // the hidden docs pages (sidebar.hidden: true, which autogenerate
            // drops from the tree). Associating them keeps the same sidebar they
            // render today.
            topics: {
              docs: [
                '/api',
                '/api/**',
                '/docs/internal/**',
                '/docs/marketing-images',
                '/docs/media-kit',
                '/docs/security/self-hosting',
                '/docs/security/self-hosting/**',
              ],
            },
            // The non-docs surface (marketing homepage, pricing, blog, changelog,
            // etc.) has no home in a docs topic and is carried as-is (ADR 0002).
            // Exclude those Starlight-rendered pages so they keep their current,
            // sidebar-less rendering. Redirect stubs are static HTML and never
            // hit this middleware.
            exclude: [
              '/',
              '/pricing',
              '/meet',
              '/jobs',
              '/privacy',
              '/terms',
              '/demo',
              '/free-tools',
              '/free-tools/**',
              '/use-cases',
              '/use-cases/**',
              '/blog',
              '/blog/**',
              '/changelog',
              '/changelog/**',
            ],
          },
        ),
        // Read-only MCP server at /mcp (see packages/starlight-mcp): `search` +
        // `get_page` tools and an llms.txt resource over Streamable HTTP. Omitted
        // when MCP_ENABLED=false so the build needs no SSR adapter.
        ...(MCP_ENABLED ? [starlightMcp({ serverName: 'Promptless Docs' })] : []),
      ],
      components: {
        Sidebar: './src/components/starlight/Sidebar.astro',
        Header: './src/components/starlight/Header.astro',
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        Footer: './src/components/starlight/Footer.astro',
        ThemeProvider: './src/components/starlight/ThemeProviderLightOnly.astro',
        MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
      },
      titleDelimiter: '|',
      markdown: {
        processedDirs: ['./src/content/blog', './src/content/changelog', './src/content/website'],
      },
      editLink: {
        baseUrl: 'https://github.com/Promptless/promptless.ai/tree/main',
      },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: '/fonts/InterVariable.woff2',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://promptless.ai/assets/social-card.png' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://promptless.ai/assets/social-card.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://www.youtube-nocookie.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://i.ytimg.com' },
        },
        {
          tag: 'script',
          attrs: { type: 'text/partytown', src: 'https://www.googletagmanager.com/gtag/js?id=G-NHEW11ZR9F' },
        },
        {
          tag: 'script',
          attrs: { type: 'text/partytown' },
          content: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-NHEW11ZR9F');`,
        },
        {
          tag: 'script',
          attrs: { type: 'text/partytown' },
          content: `!function(key){if(window.reb2b)return;window.reb2b={loaded:true};var s=document.createElement("script");s.async=true;s.src="https://b2bjsstore.s3.us-west-2.amazonaws.com/b/"+key+"/"+key+".js.gz";document.getElementsByTagName("script")[0].parentNode.insertBefore(s,document.getElementsByTagName("script")[0]);}("4N210HEGE36Z");`,
        },
      ],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@lib': '/src/lib',
      },
    },
  },
});

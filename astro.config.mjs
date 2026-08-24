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
import rehypeAppLinksNewTab from './src/lib/rehype-app-links-new-tab.ts';
import { DOCS_PRODUCTS } from './src/lib/docs-products.ts';

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
  '/docs': '/docs/for-docs/start-here/welcome',
  '/page': '/',
  '/wtd': '/',
  '/wtd-portland-2026': '/',
  '/wtd-portland-2026.ics': '/',
  '/hn': '/',
  '/site': '/#demo',
  '/site/demo': '/#demo',
  '/video-demo': '/#demo',
  '/blog/customer-stories-vellum': '/blog/customer-stories/vellum',
  '/use-cases': '/',
  '/faq': '/',
  // The dynamic source/destination pair is supported by Astro. The Vercel
  // adapter's generated regex is made trailing-slash-tolerant after build so
  // the previously published /api/.../ URLs remain one-hop redirects too.
  // See scripts/normalize-vercel-redirects.ts.
  '/api': '/docs/for-docs/api/',
  '/api/[...slug]': '/docs/for-docs/api/[...slug]',
  '/api-reference': '/docs/for-docs/api/',
  '/oss': '/docs/for-docs/start-here/open-source-quickstart',
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
  // Links to the Promptless app (app.gopromptless.ai) open in a new tab so
  // readers don't lose their place in the docs. See src/lib/rehype-app-links-new-tab.ts.
  markdown: {
    rehypePlugins: [rehypeAppLinksNewTab],
  },
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
      title: 'Promptless Documentation',
      description: 'Learn how Promptless keeps customer-facing documentation and agent instructions current.',
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
            base: 'docs/for-docs/api',
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
            'Promptless continuously improves customer-facing documentation and agent instructions.',
          details:
            'Promptless also runs the Promptless MCP server, so an MCP-capable editor (Claude Code, Cursor, or another) can connect to Promptless directly. Connect over Streamable HTTP at `https://api.gopromptless.ai/mcp` and authorize in the browser—there is no API key to create or store. In Claude Code: `claude mcp add --transport http promptless https://api.gopromptless.ai/mcp`. Setup for other editors: https://promptless.ai/docs/for-docs/connect/triggers/mcp',
          optionalLinks: [
            { label: 'Blog', url: 'https://promptless.ai/blog', description: 'Product updates, technical writing, and customer stories' },
            { label: 'Changelog', url: 'https://promptless.ai/changelog', description: 'Monthly summaries of user-visible changes' },
            { label: 'Homepage (Markdown)', url: 'https://promptless.ai/index.md', description: 'Marketing overview of Promptless' },
            { label: 'Pricing (Markdown)', url: 'https://promptless.ai/pricing.md', description: 'Plans and pricing' },
            { label: 'Free tools (Markdown)', url: 'https://promptless.ai/free-tools.md', description: 'Free documentation tools' },
          ],
        }),
        // Product-specific, folder-autogenerated docs nav (ADR 0002). The two
        // product topics wrap Starlight's native `autogenerate`, with each
        // group's `label` set explicitly to reproduce the exact current nav
        // labels/order (autogenerate would otherwise use the raw folder segment,
        // e.g. "context-sources"). Section index pages that sit beside a
        // like-named directory (Triggers, Context sources, Integrations) are
        // listed explicitly so they stay the first item in their group, matching
        // the previous Promptless for Docs output. The Sidebar override renders a
        // compact product switcher from the plugin's route data above each topic's
        // own sidebar. Promptless for Agent Instructions starts with one overview.
        starlightSidebarTopics(
          [
            {
              id: DOCS_PRODUCTS[0].id,
              label: DOCS_PRODUCTS[0].label,
              link: DOCS_PRODUCTS[0].href,
              items: [
                { label: 'Start Here', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/start-here', collapsed: true } }] },
                {
                  label: 'Connect',
                  collapsed: true,
                  items: [
                    {
                      label: 'Triggers',
                      collapsed: true,
                      items: [
                        { label: 'Triggers', slug: 'docs/for-docs/connect/triggers' },
                        { autogenerate: { directory: 'docs/for-docs/connect/triggers', collapsed: true } },
                      ],
                    },
                    {
                      label: 'Context sources',
                      collapsed: true,
                      items: [
                        { label: 'Context sources', slug: 'docs/for-docs/connect/context-sources' },
                        { autogenerate: { directory: 'docs/for-docs/connect/context-sources', collapsed: true } },
                      ],
                    },
                    { label: 'Doc locations', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/connect/doc-locations', collapsed: true } }] },
                    { label: 'Source control', slug: 'docs/for-docs/connect/source-control' },
                    { label: 'Connection health', slug: 'docs/for-docs/connect/connection-health' },
                  ],
                },
                { label: 'Tune', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/tune', collapsed: true } }] },
                { label: 'Work the queue', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/work-the-queue', collapsed: true } }] },
                {
                  label: 'Get the most out of it',
                  collapsed: true,
                  // Enumerated (not a blanket autogenerate) because this group
                  // contains a subdirectory — teach-promptless-a-custom-task/.
                  // Starlight's autogenerate labels a nested directory with its
                  // raw folder segment (no index-page frontmatter override
                  // exists for subgroup labels), so a blanket autogenerate here
                  // rendered the group label as "teach-promptless-a-custom-task".
                  // Same explicit-subgroup pattern as Connect and Reference above.
                  items: [
                    { label: 'Keep screenshots current', slug: 'docs/for-docs/get-the-most-out/screenshots' },
                    { label: 'Pay down docs debt', slug: 'docs/for-docs/get-the-most-out/pay-down-docs-debt' },
                    { label: 'Localized docs', slug: 'docs/for-docs/get-the-most-out/localization' },
                    { label: 'Changelogs & release notes', slug: 'docs/for-docs/get-the-most-out/release-notes' },
                    { label: 'Passive channel listening', slug: 'docs/for-docs/get-the-most-out/passive-channel-listening' },
                    { label: 'Build an agent knowledge base', slug: 'docs/for-docs/get-the-most-out/agent-knowledge-base' },
                    {
                      label: 'Teach a custom task',
                      collapsed: true,
                      items: [
                        { label: 'Teach a custom task', slug: 'docs/for-docs/get-the-most-out/teach-promptless-a-custom-task' },
                        { autogenerate: { directory: 'docs/for-docs/get-the-most-out/teach-promptless-a-custom-task', collapsed: true } },
                      ],
                    },
                    { label: 'Ask to update config', slug: 'docs/for-docs/get-the-most-out/ask-promptless-to-update-config' },
                  ],
                },
                { label: 'Scale', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/scale', collapsed: true } }] },
                { label: 'Audit', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/audit', collapsed: true } }] },
                { label: 'Migrate', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/migrate', collapsed: true } }] },
                { label: 'Security', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/security', collapsed: true } }] },
                { label: 'Measure impact', collapsed: true, items: [{ autogenerate: { directory: 'docs/for-docs/measure', collapsed: true } }] },
                {
                  label: 'Reference',
                  collapsed: true,
                  items: [
                    {
                      label: 'Integrations',
                      collapsed: true,
                      items: [
                        { label: 'Integrations', slug: 'docs/for-docs/reference/integrations' },
                        { autogenerate: { directory: 'docs/for-docs/reference/integrations', collapsed: true } },
                      ],
                    },
                    { label: 'Configuration reference', slug: 'docs/for-docs/reference/configuration-reference' },
                    { label: 'Frequently asked questions', slug: 'docs/for-docs/reference/faq' },
                    { label: 'Account management', slug: 'docs/for-docs/reference/account-management' },
                    { label: 'Getting support', slug: 'docs/for-docs/reference/getting-help' },
                  ],
                },
                ...openAPISidebarGroups,
              ],
            },
            {
              id: DOCS_PRODUCTS[1].id,
              label: DOCS_PRODUCTS[1].label,
              link: DOCS_PRODUCTS[1].href,
              ...(DOCS_PRODUCTS[1].badge
                ? { badge: { text: DOCS_PRODUCTS[1].badge, variant: 'note' } }
                : {}),
              items: [
                {
                  label: 'Start here',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: 'docs/governance' },
                    { autogenerate: { directory: 'docs/governance/start-here', collapsed: true } },
                  ],
                },
                { label: 'Get started', collapsed: true, items: [{ autogenerate: { directory: 'docs/governance/get-started', collapsed: true } }] },
                { label: 'Deploy the worker', collapsed: true, items: [{ autogenerate: { directory: 'docs/governance/deploy-the-worker', collapsed: true } }] },
                { label: 'Findings & remediation', collapsed: true, items: [{ autogenerate: { directory: 'docs/governance/findings-and-remediation', collapsed: true } }] },
                { label: 'Reference', collapsed: true, items: [{ autogenerate: { directory: 'docs/governance/reference', collapsed: true } }] },
              ],
            },
          ],
          {
            // Generated OpenAPI pages and hidden self-hosting pages belong to
            // Promptless for Docs even though autogenerate cannot discover them.
            topics: {
              for_docs: [
                '/docs/for-docs/api',
                '/docs/for-docs/api/**/*',
                '/docs/for-docs/security/self-hosting',
                '/docs/for-docs/security/self-hosting/**/*',
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
              '/free-tools/**/*',
              '/docs/internal/**/*',
              '/docs/marketing-images',
              '/docs/media-kit',
              '/use-cases',
              '/use-cases/**/*',
              '/blog',
              '/blog/**/*',
              '/changelog',
              '/changelog/**/*',
            ],
          },
        ),
        // Read-only MCP server at /mcp (see packages/starlight-mcp): `search` +
        // `get_page` tools and an llms.txt resource over Streamable HTTP. Omitted
        // when MCP_ENABLED=false so the build needs no SSR adapter.
        ...(MCP_ENABLED ? [starlightMcp({ serverName: 'Promptless Documentation' })] : []),
      ],
      components: {
        Sidebar: './src/components/starlight/Sidebar.astro',
        Header: './src/components/starlight/Header.astro',
        // Per-page social cards: injects each page's og:image/twitter:image,
        // pointing at its incrementally pre-generated card (/og/<slug>.png).
        // Replaces the global og:image/twitter:image that lived in head[].
        Head: './src/components/starlight/Head.astro',
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        Footer: './src/components/starlight/Footer.astro',
        ThemeProvider: './src/components/starlight/ThemeProviderDarkOnly.astro',
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
        // og:image / twitter:image are injected per page by the Head override
        // (src/components/starlight/Head.astro) so each page gets its own
        // pre-generated social card, with public/assets/social-card.png as the
        // fallback. They are intentionally no longer set globally here.
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

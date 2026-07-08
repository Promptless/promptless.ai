# Customization map

This site was **migrated onto** the Promptless [Starport template](https://github.com/Promptless/starport-template)
rather than scaffolded fresh from it, so it is already fully branded and
populated — there is no placeholder content to replace. This file is the
Starport "where to change what" map, adapted to this site's real wiring. It is
the mechanical companion to the decision records in
[`docs/starport-migration/adrs/`](docs/starport-migration/adrs/); record
decisions there first, then change config here.

The migration itself is phased and tracked in
[`docs/starport-migration/`](docs/starport-migration/README.md). Some rows below
point at capabilities that later phases move onto the template's mechanics —
those are noted inline.

## Branding

- **Site title / description** — the `starlight({ title, description })` options in `astro.config.mjs`.
- **Canonical URL** — `SITE_URL` env var (falls back to `https://promptless.ai`); drives sitemap and canonical tags.
- **Logo** — `public/assets/logo.svg` (wired via the Starlight `logo.src` option).
- **Brand colors & fonts** — `src/styles/custom.css` and `src/styles/site.css`.
- **Header / footer / title chrome** — the seven Starlight component overrides in `src/components/starlight/` (`Header`, `Footer`, `Sidebar`, `SiteTitle`, `PageTitle`, `MobileMenuFooter`, `ThemeProviderLightOnly`).

## Content

- **Docs** — `src/content/docs/docs/<section>/<page>.mdx`. Nav placement comes from each page's frontmatter (`slug`, `sidebar.order`, `sidebar.hidden`, `sidebar.label`).
- **Homepage** — `src/pages/index.astro` → `src/content/website/home.mdx` → `HeroV2.astro`.
- **Blog** — `src/content/blog/` (`generate-article` automation writes here).
- **Changelog** — `src/content/changelog/` (`launch-post` automation reads here).
- **Pricing / jobs / meet / demo / use-cases / free-tools / legal** — standalone routes under `src/pages/` and `src/content/legal/`.
- **Redirects** — `src/lib/generated/redirects.json` (hand-maintained) plus the static map in `astro.config.mjs`. Every historical URL must keep resolving.

## Baked-in (do not remove)

Mandatory infrastructure — keep it wired:

- **Agent-friendly `llms.txt` / `llms-full.txt` and per-page `.md`** — served today from `src/pages/llms.txt.ts`, `llms-full.txt.ts`, `[...slug].md.ts`, `index.md.ts`, `pricing.md.ts`, `free-tools.md.ts`. Phase 6 reconciles these with the template's `starlight-llms-txt` plugin (pick one producer per route; keep the emitted URLs and content identical, and keep the non-docs Markdown variants).
- **`.starport-template.json`** — the managed-migration version marker at the repo root. Never delete it; Promptless reads it to know which template version this site is on. Bump `templateVersion` only when re-syncing to a newer template release.
- **Diagrams** — Mermaid sources in `src/diagrams/*.mmd` compile to committed SVGs in `public/mermaid/` via `npm run build:diagrams`. Rebuild and commit the SVG when a diagram changes.

## Capabilities

- **API reference (`starlight-openapi`)** — `schema: ./public/openapi/api-triggers.yaml`, rendered under `/api/*` via the `starlightOpenAPI([...])` plugin and `openAPISidebarGroups` in `astro.config.mjs`. Phase 4 moves this to `starlight-openapi@0.26` wired through `starlight-sidebar-topics`, keeping `/api/*` URLs identical.
- **Navigation** — directory-driven since Phase 3 (ADR 0003): `starlight-sidebar-topics` wraps Starlight's native folder `autogenerate` in `astro.config.mjs`, walking `src/content/docs/docs/`. Placement/visibility come from each page's `sidebar.order`/`sidebar.hidden`; section/group labels are set explicitly in the topic config. The old `buildSidebar()` → `src/lib/generated/sidebar.json` pipeline was retired (no more generated `sidebar.json`). `scripts/generate-manifest.ts` still produces `route-manifest.json` (the `.md` endpoints need it).
- **Docs MCP server (`/mcp`)** — not wired yet. Phase 6 adds the vendored `@starport/starlight-mcp` SSR plugin plus the `@astrojs/vercel` adapter to serve `/mcp` (read-only `search` + `get_page`). Vercel is the verified target; the Cloudflare option is experimental and not used.
- **Build-time link validation (`starlight-links-validator`)** — not enabled yet. Phase 6b turns on the build-failing gate after the engine upgrade stabilizes and reconciles it with the non-blocking `check-broken-links` skill.
- **i18n** — not used. This site ships no `defaultLocale`/`locales` config and no locale content tree, and the template's sample i18n scaffolding is intentionally **not** adopted ([ADR 0004](docs/starport-migration/adrs/0004-adopt-capabilities.md)).

## Style

- Prose is linted with the repo's Vale config and the `check-broken-links` skill. Run Vale on changed prose before opening a PR (see the repo's Vale CI workflow for the exact invocation).

## Deployment

- Deployed to **Vercel**. The site is fully static today; Phase 6 adds one on-demand `/mcp` route via `@astrojs/vercel`, keeping every other route static.

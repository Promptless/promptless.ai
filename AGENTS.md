# Promptless Website (promptless.ai)

Astro + Starlight site. Deployed to Vercel.

Shared Promptless agent safety rules and reusable skills live in
`Promptless/agent-instructions` via the `promptless-internal` plugin. Keep this
file focused on website/docs repo facts.

## Documentation Map

Maintain a map of every file in `docs/` here. When you add, remove, or rename
a file in `docs/`, update this map.

```
docs/
+-- README.md           # Meta-docs: how to maintain the docs/ folder
+-- analytics.md        # PostHog setup, event catalog, tracking gaps and recommendations
```

## Project Structure

```
src/
+-- pages/              # Astro page routes (index, demo, pricing, jobs, blog/, changelog/, free-tools/)
+-- components/
|   +-- site/           # Marketing page components (Hero, DemoBooking, PricingCards, VideoEmbed, etc.)
|   +-- starlight/      # Starlight component overrides (Header, Footer, Sidebar, etc.)
|   +-- shared/         # Cross-cutting components (AnalyticsClickTracker, AnnouncementBanner, TopHeader)
|   +-- posthog.astro   # PostHog analytics init snippet
+-- content/
|   +-- docs/           # Starlight documentation content (MDX)
|   +-- blog/           # Blog posts (MDX)
|   +-- changelog/      # Changelog entries (MDX)
|   +-- website/        # Marketing page content (MDX)
|   +-- legal/          # Privacy policy, terms
+-- lib/                # Shared utilities (navigation, route manifest, content ordering)
+-- styles/             # Global CSS (custom.css, site.css)
scripts/                # Build/migration scripts
tests/smoke/            # Smoke tests
astro.config.mjs        # Astro config, redirects, Starlight setup
vercel.json             # Vercel deploy config, generated redirects
```

## Key Conventions

- **Analytics**: Use `data-track-action`, `data-track-funnel`, `data-track-location`,
  `data-track-campaign` attributes on clickable elements. See `docs/analytics.md`
  for the event catalog and naming conventions.
- **Content**: Marketing pages use content collections in `src/content/website/`.
  Docs live in `src/content/docs/`. Blog in `src/content/blog/`.
- **Redirects**: Defined in `astro.config.mjs` (static) and generated from
  `src/lib/generated/redirects.json` (migration script output).
- **Sidebar**: Generated from `src/lib/generated/sidebar.json`.

## Commands

```bash
npm install              # install dependencies
npm run dev              # dev server at localhost:4321
npm run build            # production build
npm run check            # typecheck + build
npm run test:smoke       # smoke tests
npm run build:diagrams   # compile src/diagrams/*.mmd → public/mermaid/*.svg
```

## Shared Agent Tools

- Use the shared `promptless-internal` plugin for Slack and reusable Promptless
  workflows.
- Use `generate-article` and `launch-post` from the shared plugin for the edu
  campaign/blog pipeline.
- Do not add repo-local skills unless they truly cannot live in the central
  plugin.

## Diagrams

Mermaid diagram sources live in `src/diagrams/*.mmd`. The compiled SVGs in
`public/mermaid/` are committed to the repo and must be rebuilt locally when
a diagram changes — run `npm run build:diagrams` and commit the updated SVG.
This step is intentionally excluded from the production build because it
requires a local Chromium install via `@mermaid-js/mermaid-cli`.

Each `.mmd` file supports optional rendering directives in comments at the top:

```
%% mmdc-width: 750
%% mmdc-height: 600
```

## Good Docs Project Templates

The Good Docs Project template bundle is stored at:

`meta/reference/good-docs-project-template-1.5.0/`

Use these files as read-only reference material when planning documentation information architecture, page types, explanation flow, templates, and writing patterns.

Do not edit, rewrite, reformat, rename, delete, or regenerate files under `meta/reference/good-docs-project-template-1.5.0/` unless the user explicitly asks to update the vendored template bundle itself.

When applying recommendations from the templates, make changes in the Promptless documentation source files instead, such as files under `src/content/docs/`.

# Promptless Website (promptless.ai)

Astro + Starlight site. Deployed to Vercel.

## Documentation Map

Maintain a map of every file in `docs/` here. When you add, remove, or rename
a file in `docs/`, update this map.

```
docs/
+-- README.md           # Meta-docs: how to maintain the docs/ folder
+-- analytics.md        # PostHog setup, event catalog, tracking gaps and recommendations
+-- content_strategy/   # Audience/persona/CUJ/IA strategy (see "Docs & Audience Strategy" below)
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

## Docs & Audience Strategy

Audience, persona, journey (CUJ), and proposed Docs-tab IA definitions live in
`docs/content_strategy/` (internal; not built into the site). Read the relevant file on demand —
do not inline. Derived from customer/prospect call evidence.

- `docs/content_strategy/README.md` — index + how the IDs link (start here)
- `docs/content_strategy/audiences/` — 6 target segments (`aud-*`), incl. a cross-cutting brownfield segment
- `docs/content_strategy/personas/` — 1 minimal persona per audience (`persona-*`)
- `docs/content_strategy/journeys/` — 16 critical user journeys (`cuj-*`), steps → `/docs/...`
- `docs/content_strategy/information_architecture/` — CUJ-driven Docs-tab IA + gap analysis

When planning docs IA, page types, or content priorities, consult `proposed-ia.md` and
`ia-gap-analysis.md`, and make actual content changes under `src/content/docs/`.

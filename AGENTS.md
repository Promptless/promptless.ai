# Promptless Website (promptless.ai)

Astro + Starlight site. Deployed to Vercel. Migrated onto the Promptless
[Starport template](https://github.com/Promptless/starport-template); the
`.starport-template.json` marker at the repo root records which template version
this site is on. Never delete it — Promptless reads it to run managed migrations.
See [`CUSTOMIZE.md`](CUSTOMIZE.md) for where to change what, and [`adrs/`](adrs/)
for architecture decisions (MADR format).

## Documentation Map

Maintain a map of every file in `docs/` here. When you add, remove, or rename
a file in `docs/`, update this map.

```
docs/
+-- README.md           # Meta-docs: how to maintain the docs/ folder
+-- analytics.md        # PostHog setup, event catalog, tracking gaps and recommendations
+-- events.md           # Marketing event glossary: canonical reference for every PostHog event
+-- content_strategy/   # Audience/persona/CUJ/IA strategy (see "Docs & Audience Strategy" below)
+-- starport-migration/ # Plan + ADRs for the completed migration onto the Starport Starlight template
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
packages/
+-- starlight-mcp/      # Read-only MCP server plugin (/mcp route; ADR 0007), vendored from Starport
scripts/                # Build/migration scripts
tests/smoke/            # Smoke tests
adrs/                   # Architecture Decision Records (MADR format); see adrs/README.md
astro.config.mjs        # Astro config, redirects, Starlight setup
vercel.json             # Vercel deploy config, generated redirects
CUSTOMIZE.md            # Starport "where to change what" map (branding, content, capabilities)
.starport-template.json # Starport template version marker (managed migrations) — do not delete
```

## Key Conventions

- **Analytics**: Use `data-track-action`, `data-track-funnel`, `data-track-location`,
  `data-track-campaign` attributes on clickable elements. See `docs/analytics.md`
  for the event catalog and naming conventions.
- **Content**: Marketing pages use content collections in `src/content/website/`.
  Docs live in `src/content/docs/`. Blog in `src/content/blog/`.
- **Redirects**: Defined in `astro.config.mjs` (static) merged with
  `src/lib/generated/redirects.json`. `redirects.json` is hand-maintained (the
  manifest script never writes it), so add redirect entries for moved or renamed
  pages by hand.
- **Sidebar**: The docs nav is **directory-driven** (Starport Phase 3, ADR
  0003). `starlight-sidebar-topics` wraps Starlight's native folder
  `autogenerate` in `astro.config.mjs`, walking the `src/content/docs/docs/`
  tree. Placement and visibility still come from each page's `sidebar.order` and
  `sidebar.hidden` frontmatter, and per-page nav text from `sidebar.label`
  (falling back to `title`) — Starlight reads those natively. What changed: the
  section/group labels (`Start Here`, `Connect`, `Get the Most Out`, …) are now
  set **explicitly in the `starlight-sidebar-topics` config**, not derived from
  an index page's frontmatter. There is no generated `sidebar.json` anymore, and
  no `buildSidebar()` step — the old frontmatter→`sidebar.json` pipeline was
  retired. To change nav placement or a page label, edit that page's frontmatter;
  to rename a section/group or reorder groups, edit the topic config in
  `astro.config.mjs`. `scripts/generate-manifest.ts` still runs via
  `generate:manifest` / `prebuild`, but now only produces `route-manifest.json`
  (used by the `.md` endpoints). Phase 5 (ADR 0004 §2) settled the topic model on
  a **single "Documentation" topic** — the OpenAPI `/api/*` pages live inside it,
  and the repo's `Sidebar` override renders the sublist directly, so no
  topic-switcher bar shows. Keep it that way: add new sections to the docs topic's
  `items` rather than creating a second topic, which would surface the switcher
  bar as a user-visible IA change (write an ADR first if that ever becomes intended).

## Commands

```bash
npm install              # install dependencies
npm run dev              # dev server at localhost:4321
npm run build            # production build (MCP_ENABLED=false for a static, adapter-less build)
npm run check            # typecheck + MCP contract tests + build
npm run test:mcp         # MCP server contract + index tests (packages/starlight-mcp)
npm run test:smoke       # smoke tests (serves .vercel/output/static or dist from the last build)
npm run build:diagrams   # compile src/diagrams/*.mmd → public/mermaid/*.svg
npm run lint:md          # remark-lint: Markdown/MDX structure (src/content/docs)
npm run lint:md:fix      # remark-lint auto-repair (full reflow via --output)
npm run lint:frontmatter # docmeta: frontmatter validation (needs Node >= 24)
```

## Docs linting gates (Starport v1.1.0)

Three linters gate `src/content/docs` prose/structure/metadata, each in its own
CI workflow; keep their scopes aligned (all target `src/content/docs`):

- **Vale** (`.vale.ini`, `vale.yml`) — prose style.
- **remark-lint** (`.remarkrc.mjs`, `remark-lint.yml`) — Markdown/MDX
  *structure* (heading increments, list/blank-line consistency, undefined
  references, trailing whitespace). CI auto-repairs (`--output` full reflow),
  commits the fix on same-repo PRs, and blocks on anything left. Run
  `npm run lint:md:fix` locally and commit if CI reports uncommitted fixes.
  Files using MDX syntax (`import`/`export`/JSX) must be `.mdx`, never `.md` —
  a CI guard enforces this. See ADR 0005.
- **docmeta** (`docmeta.config.yaml`, `schemas/`, `docmeta.yml`) — frontmatter
  *content* against three schemas (Starlight mirror, Google OKF, extension
  seam). **Every docs page requires `type`** (`landing` | `guide` | `reference`)
  and should carry `tags` and a quoted ISO 8601 `timestamp`. Add repo-specific
  required fields in `schemas/custom-frontmatter.schema.json`, not the config.
  Runs on Node 24. See ADR 0006.

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

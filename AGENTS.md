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
+-- pages/              # Astro page routes (index, demo, pricing, jobs, blog/, changelog/, free-tools/, agent-score/)
|   +-- agent-score/    # Agent Score landing (static) + on-demand [...site] report, .md twin, og.png
+-- components/
|   +-- site/           # Marketing page components (Hero, DemoBooking, PricingCards, VideoEmbed, etc.)
|   +-- agent-score/    # Agent Score landing sections, report sections, scan form, client scripts
|   +-- starlight/      # Starlight component overrides (Header, Footer, Sidebar, etc.)
|   +-- shared/         # Cross-cutting components (AnalyticsClickTracker, AnnouncementBanner, TopHeader)
|   +-- posthog.astro   # PostHog analytics init snippet
+-- content/
|   +-- docs/           # Starlight documentation content (MDX)
|   +-- blog/           # Blog posts (MDX)
|   +-- changelog/      # Changelog entries (MDX)
|   +-- website/        # Marketing page content (MDX)
|   +-- legal/          # Privacy policy, terms
+-- partials/           # MDX partials embedded in docs pages (@partials/*); integrations/ holds connection procedures (ADR adrs/0007); glossary/ is generated from terms/
+-- lib/                # Shared utilities (navigation, route manifest, content ordering)
|   +-- agent-score/    # Agent Score API contract types, metadata, slug rules, report/OG builders, fixtures
+-- styles/             # Global CSS (custom.css, site.css); agent-score.css is imported by its components only
packages/
+-- starlight-mcp/      # Read-only MCP server plugin (/mcp route; ADR 0007), vendored from Starport
scripts/                # Build/migration scripts; agent-score-mock-api.ts is the local Agent Score API mock
tests/smoke/            # Smoke tests
tests/unit/             # Unit tests (node --import tsx --test tests/unit/*.spec.ts)
terms/                  # Termbase: one manni term page per concept (see terms/README.md, ADR adrs/0009)
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
  Promptless for Docs lives in `src/content/docs/docs/for-docs/`; Promptless for
  Agent Instructions starts at `src/content/docs/docs/governance.mdx`. Blog
  lives in `src/content/blog/`.
- **Redirects**: Defined in `astro.config.mjs` (static) merged with
  `src/lib/generated/redirects.json`. `redirects.json` is hand-maintained (the
  manifest script never writes it), so add redirect entries for moved or renamed
  pages by hand. Every source also matches with a trailing slash
  (`scripts/normalize-vercel-redirects.ts`), so add only the no-slash form.
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
  (used by the `.md` endpoints). [ADR 0002](adrs/0002-split-documentation-by-product.md)
  supersedes only the single-topic decision in Starport ADR 0004 §2. Keep the
  two product topics separate: Promptless for Docs owns `/docs/for-docs/*`
  (including its OpenAPI pages), while Promptless for Agent Instructions owns
  `/docs/governance` until that product's docs expand. Shared product metadata
  lives in `src/lib/docs-products.ts`; the custom Sidebar switcher uses the
  plugin's current-topic route data.

## Commands

```bash
npm install              # install dependencies
npm run dev              # dev server at localhost:4321
npm run dev:agent-score-mock # local Agent Score API mock on 127.0.0.1:5000 (see README)
npm run build            # production build (Vercel adapter; also renders /agent-score/<site> on demand)
npm run check            # typecheck + MCP contract tests + build
npm run test:mcp         # MCP server contract + index tests (packages/starlight-mcp)
npm run test:smoke       # smoke tests (serves .vercel/output/static or dist from the last build)
npm run build:diagrams   # compile src/diagrams/*.mmd → public/mermaid/*.svg
npm run lint:md          # remark-lint: Markdown/MDX structure (src/content/docs)
npm run lint:md:fix      # remark-lint auto-repair (full reflow via --output)
npm run lint:frontmatter # manni: frontmatter validation (needs Node >= 24)
npm run lint:structure   # manni: page structure by `type:` (advisory in CI)
npm run lint:terms       # manni term: check concepts: against terms/, lint definitions (needs Vale)
npm run terms:write      # regenerate the glossary partials and the Terms Vale style from terms/
npm run lint:a11y        # manni: axe-core accessibility crawl (needs `npm run build && npm run preview` running)
npx manni meta derive    # restamp created / last-updated / owner after editing a docs page
npx manni check          # run every manni check set up here (or pass pages); never restamps
```

## Docs linting gates (Starport v1.1.0)

Three linters gate `src/content/docs` prose/structure/metadata, each in its own
CI workflow; keep their scopes aligned (all target `src/content/docs`):

- **Vale** (`.vale.ini`, `vale/Promptless/`, `vale.yml`) — prose style. The
  rules live in `vale/Promptless/`, a Vale package this repo publishes: the
  `vale-package.yml` workflow zips it onto the `vale` GitHub release on every
  push to `main` that touches it, and other Promptless repos sync it from
  there. The site consumes the same package (`Packages = ./vale/Promptless`),
  so run `vale sync` once locally, then `vale <file>`; `.vale/styles/` is the
  synced output and is gitignored. Styles: `Promptless` (house terminology,
  sentence-case headings) plus `Voices`, `Direct`, and `Moose` vendored from
  hawkeyexl/moose-vale (see `vale/Promptless/NOTICE`). Any error fails CI.
- **remark-lint** (`.remarkrc.mjs`, `remark-lint.yml`) — Markdown/MDX
  *structure* (heading increments, list/blank-line consistency, undefined
  references, trailing whitespace). CI auto-repairs (`--output` full reflow),
  commits the fix on same-repo PRs, and blocks on anything left. Run
  `npm run lint:md:fix` locally and commit if CI reports uncommitted fixes.
  Files using MDX syntax (`import`/`export`/JSX) must be `.mdx`, never `.md` —
  a CI guard enforces this. See Starport ADR 0005.
- **manni** (`manni.config.yaml`, `docs.metadata.yaml`, `manni.yml`) —
  frontmatter *content* against manni's built-in Starlight schema
  (`astro:starlight:0.41`), the open and strict versions of six manni
  vocabularies (core, stewardship, audience, lifecycle, structure,
  ai-context), and The Good Docs Project page types (`tgdp:templates:1.1`).
  **Every docs page requires `title`, `description`, and `type`.** Use a
  [Good Docs Project template slug](https://www.thegooddocsproject.dev/template)
  for `type`, such as `concept`, `how-to`, `reference`, `quickstart`, or
  `troubleshooting`; CI doesn't reject other values, so check the spelling.
  Every page also needs an `id`: the slug without `docs/`, with `/` replaced
  by `-`; keep it when a page moves. No schema requires `id`, but CI fails
  without it: `owner` and `created` are stamped into `docs.metadata.yaml`
  under the page's `id`, so a page with no `id` fails `derived:stale`, and an
  entry whose page lost its `id` fails as an orphan. Reader-facing fields (`keywords`, `audiences`, `intent`,
  `lifecycle`, `applies-to`, `concepts`, `prerequisites`, `next-steps`,
  `related-pages`, `risks`, `sample-questions`, `last-updated`) live in
  frontmatter. Maintainer fields (`owner`, `created`, `personas`, `journeys`,
  `visibility`, `source-of-truth`, `meta-provenance`) live in
  `docs.metadata.yaml`, keyed by `id`; never put them in a page.
  `created`, `last-updated`, and `owner` are stamped from git and CODEOWNERS:
  after you commit a change to a page's body, run `npx manni meta derive` and
  commit the result, or CI fails with `derived:stale`. Then run
  `npx manni check` to verify (pass page paths to check only those): it runs
  every manni check this repo has set up, including the `meta validate` CI
  runs, and reports a stale stamp, but it doesn't restamp, so `derive` is
  always the fix.
  `manni check` also runs the structure lint below, so read which check
  failed: only `meta validate` blocks CI.
  Runs on Node 24. See [ADR 0005, Adopt manni and its strict metadata vocabularies](adrs/0005-adopt-manni-vocabularies.md).
- **manni lint** (`lint:` in `manni.config.yaml`, `structure` job in
  `manni.yml`) — page *structure* against the template for the page's
  `type:`: the built-in Good Docs Project templates (`npx manni lint
  templates`), with `installation-guide` and `quickstart` routed to how-to
  and `glossary` and `contact-support` to reference. For example, a how-to
  needs an `Overview` H2 first and a `See also` H2 last, and every reference
  H2 after the first needs a table. Run `npx manni lint templates show
  tgdp:how-to:1.6` (or another template) to see each section a template asks
  for and what it's for. Each finding names the template section it breaks
  and repeats that purpose. Advisory: on a PR, CI annotates the pages
  you changed but doesn't fail. Fix the findings on pages you edit; run
  `npm run lint:structure -- <page>` locally, and add `--explain` to see
  which template a page routed to. See [ADR 0006](adrs/0006-adopt-manni-lint-structure.md).
- **manni term** (`terms/`, `terms` job in `manni.yml`) — every `concepts:`
  value must name a term page in `terms/` by label, id, or alt-label, or CI
  fails. When you add a new concept, add its term with `npx manni term fill
  -o terms/<for-docs|governance|topics>/`, write or check the definition, and
  run `npm run terms:write`. That regenerates the glossary partials in
  `src/partials/glossary/` and the `Terms` Vale style in `.vale/styles/Terms/`;
  commit both, because CI fails when they're stale. Never edit them by hand.
  Definitions are held to the house Vale styles (`npx manni term lint`). The
  `Terms` style warns on docs pages about a term in the wrong case, such as
  `GitHub app` for `GitHub App`. See [`terms/README.md`](terms/README.md) and
  [ADR 0009](adrs/0009-adopt-manni-term.md).
- **manni a11y** (`a11y:` in `manni.config.yaml`,
  `.github/workflows/a11y-scheduled.yml`) — accessibility of the *rendered*
  site, not only `src/content/docs`. It doesn't run on pull requests. Every
  Monday, and on demand from the Actions tab, the workflow builds and serves
  `main`, crawls every page from `http://127.0.0.1:4321/`, and runs axe-core
  on each. When it finds a serious or critical violation, it sends the
  findings to the Promptless API (`POST /v1/triggers`) so Promptless opens a
  fix, and the run fails. A component, stylesheet, or page change can cause
  a finding. Common causes are text below 4.5:1 contrast and an `aria-label`
  that leaves out the control's visible text. Others are a skipped heading
  level and an ARIA role without its required children. To check a change
  before merge, run `npm run build`, then `npm run preview` in one terminal
  and `npm run lint:a11y` in another. Each finding names the page, the axe
  rule, and the element. `/meet` and
  `/docs/for-docs/start-here/how-promptless-works` are excluded because their
  findings are inside third-party embeds. See
  [ADR 0008](adrs/0008-adopt-manni-a11y.md).

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
- `docs/content_strategy/journeys/` — 16 critical user journeys (`cuj-*`), steps → `/docs/for-docs/...`
- `docs/content_strategy/information_architecture/` — CUJ-driven Docs-tab IA + gap analysis

When planning docs IA, page types, or content priorities, consult `proposed-ia.md` and
`ia-gap-analysis.md`, and make Promptless for Docs content changes under
`src/content/docs/docs/for-docs/`.

# ADR 0006 — Adopt docmeta (frontmatter validation) from template v1.1.0

- Status: accepted
- Date: 2026-07-13
- Deciders: Manny
- Context source: #docs Slack thread, 2026-07-13 ("updates were made to the template for the v1.1.0 version (mdx linting, docmeta support) … implement them for our docs")

## Context

The second capability template v1.1.0 adds (alongside remark-lint,
[ADR 0005](0005-adopt-remark-lint.md)) is **frontmatter validation** with
docmeta. Today the repo lints prose (Vale), Markdown/MDX structure (remark-lint),
and links (`starlight-links-validator`), but nothing validates **frontmatter
content**. Astro's zod schema (`docsSchema()` in `src/content.config.ts`) does
validate Starlight's fields, but only at build time, late in `npm run check`,
without per-field PR annotations, and it silently **strips** unknown keys rather
than checking them. The template's decision record (its own ADR 0005) chose
docmeta because it fails fast in CI with per-field annotations, ships Google's
Open Knowledge Format (OKF) built in so pages are self-describing for agent
consumers, and offers a customer extension seam.

## Decision

**Adopt docmeta on the template's terms, scoped to `src/content/docs`,
validating every page against the same three-schema stack the template uses.**

`docmeta.config.yaml` runs three schemas per file, in order:

1. **`schemas/starlight-frontmatter.schema.json`** — a hand-authored JSON Schema
   mirror of `@astrojs/starlight@0.41`'s frontmatter zod schema. `title` is the
   only required field; `additionalProperties` stays `true` so each schema
   polices only its own fields.
2. **`google:okf:0.1`** — docmeta's built-in OKF schema. Requires `type`;
   format-checks `tags`, `timestamp` (ISO 8601 date-time), and `resource` (URI)
   when present.
3. **`schemas/custom-frontmatter.schema.json`** — empty by default; the
   extension seam for future repo-specific required fields, so
   `docmeta.config.yaml` never has to change.

Scripts: `lint:frontmatter` (`docmeta validate --quiet`). CI:
`.github/workflows/docmeta.yml`, a blocking read-only job (`--format github` for
inline PR annotations), SHA-pinned actions, on its own workflow because docmeta
requires Node ≥ 24 while the rest of the toolchain runs Node 22.

### Adaptation to this repo (vs. the template)

- **Scope is `src/content/docs`.** Matches the remark-lint and Vale scope; blog,
  changelog, and marketing content are not held to the docs frontmatter schema
  (they have their own zod schemas in `src/content.config.ts`).
- **The `access` / `groups` fields are omitted from the Starlight schema mirror.**
  Those are the template's MCP auth-seam fields (typed in its
  `packages/starlight-mcp`). This site **deferred the MCP package**
  ([ADR 0004](0004-adopt-capabilities.md) §3), so those keys do not exist here.
  If the MCP server is adopted later, add them back to the mirror.
- **All 66 docs pages now carry `type`, `tags`, and `timestamp`.** The template
  ships its six sample pages with these; our pages had none (`type` is
  OKF-required, so every page failed until added). `type` uses the template's
  taxonomy — `landing` (section overviews/hubs), `guide` (task/how-to prose), or
  `reference` (integrations, triggers, context-source connectors, config, FAQ,
  account, security facts). `tags` are path-grounded (section + subsection +
  type). `timestamp` is each page's last-commit date in ISO 8601 date-time form
  (the one pre-existing bare-date `timestamp` was normalized to pass OKF).

## Consequences

- **A blocking frontmatter gate in CI, with per-field annotations before build.**
  `npm run lint:frontmatter` reports 66/66 passing on this branch.
- **The Starlight JSON Schema is a hand-maintained mirror of the zod schema.** On
  Starlight upgrades, diff `node_modules/@astrojs/starlight/schema.ts` against
  it. Drift fails safe: an unknown field passes docmeta
  (`additionalProperties: true`) and is still checked by zod at build; a stale
  constraint over-reports, which the annotation makes obvious.
- **OKF `timestamp` is manually maintained** (date of last meaningful change),
  distinct from Starlight's git-derived `lastUpdated`. It only format-fails when
  malformed; a stale value does not fail CI. House style quotes the value.
- **Known limitation (inherent to the multi-schema stack):** a misspelled
  *optional* top-level key is not caught, because every schema must set root
  `additionalProperties: true` (an unknown key may belong to another schema).
  Typos inside nested objects (`sidebar`, `hero`) and required-field typos *are*
  caught.
- **Content contract:** every new docs page needs `type` (and should carry
  `tags`/`timestamp`). New dev dependency `docmeta@1.2.0`; running
  `lint:frontmatter` locally needs Node 24 (npm does not enforce `engines`, so
  the Node-22 install and other jobs are unaffected).

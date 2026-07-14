# ADR 0005 — Adopt remark-lint (Markdown/MDX structure linting) from template v1.1.0

- Status: accepted
- Date: 2026-07-13
- Deciders: Manny
- Context source: #docs Slack thread, 2026-07-13 ("updates were made to the template for the v1.1.0 version (mdx linting, docmeta support) … implement them for our docs")

## Context

The initial Starport migration (Phases 1–7) landed our site on template version
`1.0.0` and is complete. The template has since shipped `1.1.0`, which adds two
capabilities: **Markdown/MDX structure linting (remark-lint)** and
**frontmatter validation (docmeta)**. Manny asked us to adopt the v1.1.0 updates.
This ADR covers remark-lint; docmeta is [ADR 0006](0006-adopt-docmeta.md).

Today the repo lints prose (Vale), types (`astro check`), and internal links
(build-time `starlight-links-validator`), but nothing checks **Markdown/MDX
structure** — heading increments, list and blank-line consistency, undefined
link references, trailing whitespace, hard tabs. These are mechanical defects
Vale is not designed to catch. The template's decision record (its own ADR 0004)
chose `remark-lint` via `remark-cli` over markdownlint, mdxlint, and
eslint-plugin-mdx because it is the only mature option that parses MDX natively
**and** shares the parser Astro + Starlight already use to render this site, so
the linter's model of a file matches the renderer's.

## Decision

**Adopt remark-lint on the template's terms, scoped to `src/content/docs`.**

- Config in `.remarkrc.mjs`: parser plugins (`remark-frontmatter`, `remark-gfm`,
  `remark-directive`, `remark-mdx`) before the lint presets
  (`remark-preset-lint-consistent`, `remark-preset-lint-recommended`).
  `remark-directive` is required so Starlight asides (`:::note[…]`) parse as
  directives instead of tripping `no-undefined-references`. `remark-stringify`
  `settings` pin the repo's house style (`-` bullets, single-space list indent,
  `---` rules, fenced code) so the `--output` autofix reflows minimally.
- Scripts: `lint:md` (`--frail --quiet`, non-zero on any finding) and
  `lint:md:fix` (`--output --quiet`).
- CI: `.github/workflows/remark-lint.yml` — the template's "auto-repair → commit
  → verify-committed → block" flow, with the MDX-in-`.md` guard, actions pinned
  to commit SHAs (the job holds `contents: write`), auto-commit gated to
  same-repo PRs, and a `git diff --exit-code` guard so the job cannot go green
  with unpushed fixes on a fork.

### Adaptation to this repo (vs. the template)

- **Scope is `src/content/docs`, not `src/content`.** The template lints all of
  `src/content` because that is its only content. Our repo also has `blog/`,
  `changelog/`, `website/`, `websiteMarkdown/`, and `legal/`, which follow their
  own conventions (title-case headings, marketing prose). Scoping remark-lint to
  `src/content/docs` matches the existing Vale scope (`src/content/docs/**` in
  `.vale.ini`) and docmeta's scope, so the three linters agree on what "docs"
  means and non-docs content is not reflowed.
- The CI guard, auto-commit `file_pattern`, and the "ensure committed" diff check
  are all scoped to `src/content/docs` to match.

## Consequences

- **One-time reflow churn (65 files).** `--output` is a full restringify, not a
  surgical fix — remark has no "fix only the flagged rule" mode. The first run
  reflowed existing docs once (table-cell padding normalized, list-marker and
  list-item indentation, JSX blank lines) and is committed on this branch;
  stable thereafter. This is the reviewed, expected churn the template's ADR 0004
  calls out.
- **Verified render-safe.** ADR 0004's central trap is applying `remark-mdx` to a
  `.md` file that contains MDX-only syntax (remark parses it as MDX, Astro as
  CommonMark, and the autofix breaks rendering). All 66 of our docs pages are
  already `.mdx`, so the trap does not apply. `npm run build` (145 pages, link
  validation) and `npm run test:smoke` (14 tests) pass on the reflowed tree, and
  spot-checked component-heavy pages (`<Steps>`, `<CardGrid>`, `<details>`) still
  render.
- **The MDX-in-`.md` guard is future-proofing.** We have no `.md` docs today; the
  guard keeps the invariant if one is ever added.
- New dev-dependency surface: `remark-cli`, `remark-directive`,
  `remark-frontmatter`, `remark-gfm`, `remark-mdx`, `remark-preset-lint-consistent`,
  `remark-preset-lint-recommended`. No runtime/deploy-shape change.

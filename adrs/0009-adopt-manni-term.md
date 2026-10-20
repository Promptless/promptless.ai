# Keep a checked termbase with manni term

- Status: accepted
- Date: 2026-10-20
- Deciders: Manny (requested in #docs, 2026-10-20)
- Context source: [manni term documentation](https://hawkeyexl.github.io/manni/term/)

## Context and Problem Statement

[ADR 0005](0005-adopt-manni-vocabularies.md) gave docs pages a `concepts:`
field, and 131 pages use it, but nothing defines the values. A typo or a new
name creates a concept no page explains, and the docs have no glossary. Term
casing, such as `GitHub App`, is enforced only where someone wrote a one-off
Vale rule. `manni term`, from the package this repo already runs, keeps a
termbase, checks every `concepts:` value against it, lints the definitions with
Vale, and renders the set as a glossary and as a Vale style.

## Decision Drivers

- Every `concepts:` value names a defined term.
- One source for each definition, shown to readers and used by the linters.
- Generated files can't fall behind the termbase unnoticed.
- No Starlight page per term, and no change to how docs pages are written.

## Considered Options

- Term pages in `terms/`, rendered into glossary partials.
- Term pages under `src/content/docs`, one published page per term.
- A single manifest file (`term.manifests`) instead of term pages.

## Decision Outcome

Chosen option: **term pages in `terms/`, rendered into glossary partials**.

- `terms/` holds one page per term (`type: term`), in `for-docs/`,
  `governance/`, and `topics/`. `manni term fill` created the first 86 from
  the `concepts:` values the pages already used, with model-drafted
  definitions that were then rewritten against the docs. `terms/README.md`
  covers the layout and tasks.
- `manni.config.yaml` declares a `terms` collection, judged by
  `manni:terminology:1.2.0` and its strict overlay, and points
  `tools.vale.config` at `.vale.ini`.
- `manni term write -f markdown` renders `terms/for-docs/` and
  `terms/governance/` into definition lists in `src/partials/glossary/`.
  Two glossary pages, one per product (ADR 0002), embed them. `manni term
  write` replaces the whole target file, and a written list is read back as
  terms, so it can't target a Starlight page directly. `remark-definition-list`
  renders the lists as `<dl>`. `topics/` (subject areas and vendors) isn't
  rendered.
- `manni term write -f vale` generates the `Terms` Vale style, committed in
  `.vale/styles/Terms/` (excepted from the `.gitignore` rule that covers
  synced styles). `.vale.ini` adds `Terms` to the docs pages and adds a
  section for the temporary `<id>.definition.md` files that `manni term lint`
  writes, so definitions meet the same styles.
- `manni.yml` gains a `terms` job: `term check`, `term lint`, and
  `npm run terms:check`, the drift check for the generated files. All three
  block merge.

### Consequences

- Good: a page can't name an undefined concept, and readers get a glossary
  per product.
- Good: term casing comes from the termbase, not hand-written rules.
- Tradeoff: on docs pages the generated casing rules run as warnings, not
  errors. Vale also lints frontmatter values such as `id` and `slug`, domains
  such as `gitlab.com`, and link targets inside MDX components, so correct
  lowercase identifiers matched the vendor-name rules (about 120 of the 125
  findings at adoption). The `vale` workflow blocks only on errors, so these
  rules don't gate merge. Follow-up: make them errors once the generated
  rules can skip those scopes, or the identifiers are excluded.
- Tradeoff: the `keyword-candidate` notice lists 61 `keywords:` values that
  name no term. They're notices and don't fail CI.
- Tradeoff: a new term needs a directory, so `manni term fill` runs with
  `-o terms/<directory>/`.

## Pros and Cons of the Options

### Term pages in `terms/`, rendered into glossary partials

- Good: each term is a small file that `fill` can create and a reviewer can
  read, and the glossary pages keep their own frontmatter.
- Bad: two generated partials and a Vale style to keep current, which the
  drift check covers.

### Term pages under `src/content/docs`, one published page per term

- Good: no rendering step.
- Bad: 86 thin pages in the sitemap and search, each needing the full docs
  frontmatter contract.

### A single manifest file

- Good: one file.
- Bad: `term fill` creates and fills term pages only, and reports manifest
  entries as skipped.

# Lint docs page structure by page type with manni lint

- Status: accepted
- Date: 2026-10-19
- Deciders: Promptless docs team (requested through a Promptless dashboard task, 2026-10-19)
- Context source: [manni lint documentation](https://hawkeyexl.github.io/manni/lint/)

## Context and Problem Statement

[ADR 0005](0005-adopt-manni-vocabularies.md) gave every page in
`src/content/docs` a `type:` drawn from The Good Docs Project (TGDP) template
slugs, but nothing checks that a page has the shape its type promises. A page
typed `reference` can be a nine-step procedure. `manni lint structure`, from
the same package, routes each page to a template by its `type:` and reports
missing, misordered, or unexpected sections and content.

## Decision Drivers

- Check structure with the tool and config this repo already runs.
- Lint every page type the site uses, without custom templates to maintain.
- Avoid blocking unrelated pull requests on the existing pages, almost all of
  which predate the templates.

## Considered Options

- Built-in TGDP templates, advisory in CI.
- Built-in TGDP templates, blocking in CI.
- Custom templates written to match the site's current pages.

## Decision Outcome

Chosen option: **built-in TGDP templates, advisory in CI**, because it
measures the site against the same TGDP model its `type:` values come from
and adds structure findings to pull requests without blocking them.

- `manni.config.yaml` gains a `lint:` section. Pages route by `type:` to the
  built-in `tgdp:*:1.6` templates. `lint.types` maps the four types the site
  uses that manni ships no template for: `installation-guide` and
  `quickstart` to `tgdp:how-to:1.6`, and `glossary` and `contact-support` to
  `tgdp:reference:1.6`.
- `manni.yml` adds a `structure` job. On a pull request it lints only the
  docs pages the pull request adds or changes and annotates them inline. On
  `main` it lints the whole `site` collection. Both steps use
  `continue-on-error`, so findings never fail the workflow.
- `npm run lint:structure` runs the same lint locally.

### Consequences

- Good: authors see structure findings on the pages they edit.
- Good: `type:` values now mean something checkable. A page whose content
  doesn't fit its type shows up as findings.
- Tradeoff: at adoption, 131 of 132 pages failed, with 415 findings. Most
  are `reference` sections with no table (the TGDP reference template asks
  every entry section after the first for one) and `concept` pages with no
  `Use cases` section. The first two passes fixed ten pages, leaving 121
  failing pages with 320 findings.
- Tradeoff: `npx manni check` now includes the structure job, so it exits 1
  on any page with structure findings even when frontmatter is clean.
- Follow-up: fix pages as they're edited. When the backlog is small, remove
  `continue-on-error` from the pull-request step to make structure findings
  block merge. If a TGDP template proves a poor fit for how this site writes
  a type, override it with a template file under `lint.templates`, and record
  that in a new ADR.

## Pros and Cons of the Options

### Built-in TGDP templates, advisory in CI

- Good: No templates to maintain, and no pull request blocked by old pages.
- Bad: Findings can be ignored until the step is made blocking.

### Built-in TGDP templates, blocking in CI

- Good: Strongest guarantee.
- Bad: Every pull request that touches an existing page fails until that
  page is restructured.

### Custom templates written to match the site's current pages

- Good: Most pages would pass on day one.
- Bad: Encodes the current structure, including the mismatches the lint is
  meant to find, and adds templates to maintain.

# Check the rendered site's accessibility with manni a11y

- Status: accepted
- Date: 2026-10-20
- Deciders: Promptless docs team (requested by Manny in #docs, 2026-10-20)
- Context source: [manni a11y documentation](https://hawkeyexl.github.io/manni/a11y/)

## Context and Problem Statement

[ADR 0005](0005-adopt-manni-vocabularies.md) and
[ADR 0006](0006-adopt-manni-lint-structure.md) check page source:
frontmatter and section structure. Nothing checks the HTML readers get, where
most accessibility defects live: color contrast, accessible names, landmarks,
and heading order. Most of that markup comes from shared components and
stylesheets, not from page source. `manni a11y check`, from the same package,
crawls a served site and runs axe-core on every page.

## Decision Drivers

- Check accessibility with the tool and config this repo already runs.
- Catch regressions in shared components and styles, which touch every page.
- Keep the check deterministic. A finding inside a third-party embed can't be
  fixed here and shouldn't fail a pull request.

## Considered Options

- Crawl the whole built site in CI, gated at `severity: error`.
- Crawl the whole built site in CI, gated at every severity.
- Restrict axe to WCAG-tagged rules (`tags`) at every severity.
- Run a scheduled check against the live site only.

## Decision Outcome

Chosen option: **crawl the whole built site in CI, gated at
`severity: error`**. It covers every page that shares the docs chrome. It
blocks the serious and critical findings this repo can fix, whether axe files
them under WCAG or best practice.

- `manni.config.yaml` gains an `a11y:` section. It seeds the crawl at
  `http://127.0.0.1:4321/`, reports serious and critical findings
  (`severity: error`), and excludes `/meet` and
  `/docs/for-docs/start-here/how-promptless-works`. It also excludes linked
  `.ics` and `.yaml` downloads, which the browser can't open as pages.
- `manni.yml` adds an `a11y` job. It builds the site, serves it with
  `npm run preview`, and runs `npx manni a11y check --format github`. The job
  blocks merge. The workflow's `paths` filter now includes `src/**`,
  `packages/**`, `public/**`, and `astro.config.mjs`, because component and
  style changes change the rendered pages.
- `npm run lint:a11y` runs the same check locally against a running
  `npm run preview`.
- `manni site preview` isn't used. It runs `astro preview`, which the Vercel
  adapter doesn't support.

### Consequences

- Good: a change to the header, footer, search, or a stylesheet is checked on
  every page it affects, before merge.
- Tradeoff: at adoption, all 240 crawled pages failed, with 544 findings
  (251 serious or critical). Most were shared markup repeated on every page.
  The docs-product menu and the search button had an `aria-label` that left
  out their visible text. The footer was a `contentinfo` landmark nested
  inside `<main>`. starlight-openapi example code and its `required`
  marker fell below 4.5:1 contrast. The same pull request fixes every finding
  outside third-party embeds and upstream Starlight markup.
- Tradeoff: two pages are excluded because their findings are inside
  third-party embeds. On `/meet` it's the Cal.com booking widget. On
  `how-promptless-works` it's the Tella player's poster image, which has no
  alt text, inside its iframe. The exclusion also skips this repo's own markup on
  those pages.
- Tradeoff: moderate findings from Starlight's own markup remain, so the gate
  can't drop to `warning` yet. Each `<Aside>` is an `<aside>` landmark named
  only by its type ("Note"), which fails `landmark-unique` on pages with two
  asides of one type. starlight-openapi renders example headings as `<h5>`
  under `<h3>`, which fails `heading-order`.
- Tradeoff: the job adds about 12 minutes: about 2 to build and about 10 to
  crawl.
- Follow-up: when upstream fixes the moderate findings, lower `severity` to
  `warning`, then `notice`. If Tella or Cal.com fix their embeds, remove
  their exclusions.

## Pros and Cons of the Options

### Whole built site, `severity: error`

- Good: blocks the findings that affect readers most, from any rule set.
- Bad: moderate findings are dropped from the report until the floor drops.

### Whole built site, every severity

- Good: strongest guarantee.
- Bad: fails every pull request on the Starlight aside and starlight-openapi
  heading findings, which this repo can't fix in its own code.

### WCAG-tagged rules only

- Good: maps to a conformance target (WCAG 2.2 AA).
- Bad: drops best-practice rules, including serious ones, and keeps the
  moderate WCAG findings that upstream markup causes.

### Scheduled check of the live site only

- Good: no build in CI; catches CMS and third-party changes.
- Bad: finds regressions after they ship, not before merge.

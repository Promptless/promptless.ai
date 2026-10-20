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
- Don't slow down pull requests. The crawl takes about 10 minutes, plus about
  2 to build, and a blocking 12-minute job on every pull request isn't
  acceptable (Manny, #docs, 2026-10-20).
- Keep the check deterministic. A finding inside a third-party embed can't be
  fixed here and shouldn't fail the check.

## Considered Options

- Crawl the whole built site on every pull request, gated at `severity: error`.
- Crawl the whole built site on a weekly schedule, gated at `severity: error`,
  and ask Promptless to fix any failures.
- Gate at every severity, or restrict axe to WCAG-tagged rules (`tags`).
- Run a scheduled check against the live site.

## Decision Outcome

Chosen option: **crawl a fresh build of `main` every week, gated at
`severity: error`, and send any failures to Promptless to fix**. It covers
every page that shares the docs chrome and reports the serious and critical
findings this repo can fix, whether axe files them under WCAG or best
practice, without adding time to pull requests.

- `manni.config.yaml` gains an `a11y:` section. It seeds the crawl at
  `http://127.0.0.1:4321/`, reports serious and critical findings
  (`severity: error`), and excludes `/meet` and
  `/docs/for-docs/start-here/how-promptless-works`. It also excludes linked
  `.ics` and `.yaml` downloads, which the browser can't open as pages.
- `.github/workflows/a11y-scheduled.yml` runs every Monday at 15:17 UTC, and
  on demand (`workflow_dispatch`). It builds `main`, serves it with
  `npm run preview`, and runs `npx manni a11y check --format json`. It
  uploads the JSON report as the `a11y-report` artifact.
- When the check exits `1` (violations, or pages that failed to load), the
  workflow writes the findings to the step summary and sends them to
  `POST https://api.gopromptless.ai/v1/triggers`. The request carries the
  page, axe rule, and first failing element for each finding, and the run
  URL. Promptless then opens or updates a suggestion that fixes them. The
  `Idempotency-Key` is the run ID and attempt, so a retried request can't
  open a second task. The run then fails. Exit `2` (the seed URL didn't
  load) fails the run without a request, because nothing was checked.
- The workflow needs the repository secret `PROMPTLESS_API_KEY`, an API key
  from Promptless **Settings > API Access**. Without it, a failing run reports
  the missing secret and requests nothing.
- `npm run lint:a11y` runs the same check locally against a running
  `npm run preview`, so authors can check a change before merge.
- `manni site preview` isn't used. It runs `astro preview`, which the Vercel
  adapter doesn't support.

### Consequences

- Good: a change to the header, footer, search, or a stylesheet is checked on
  every page it affects within a week, and the fix arrives as a Promptless
  suggestion instead of a task someone has to pick up.
- Good: pull requests get no slower.
- Tradeoff: a regression can ship and stay live for up to a week before the
  check finds it. Authors who change shared components or styles can run
  `npm run lint:a11y` before merge.
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
- Follow-up: when upstream fixes the moderate findings, lower `severity` to
  `warning`, then `notice`. If Tella or Cal.com fix their embeds, remove
  their exclusions.

## Pros and Cons of the Options

### Every pull request, `severity: error`

- Good: blocks a regression before it ships.
- Bad: adds about 12 minutes to every pull request that touches the site.

### Weekly schedule, `severity: error`, remediation through Promptless

- Good: no pull request cost; failures turn into a proposed fix, not a red
  check someone has to triage.
- Bad: a regression can be live for up to a week.

### Every severity, or WCAG-tagged rules only

- Good: every severity is the strongest guarantee; WCAG tags map to a
  conformance target (WCAG 2.2 AA).
- Bad: every severity fails on the Starlight aside and starlight-openapi
  heading findings, which this repo can't fix in its own code. WCAG tags drop
  best-practice rules, including serious ones.

### Scheduled check of the live site

- Good: no build in CI; catches CMS and third-party changes.
- Bad: the seed URL and exclusions in `manni.config.yaml` target the local
  build, so the live site would need its own config.

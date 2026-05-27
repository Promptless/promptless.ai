# Docs Usage Metrics & Instrumentation Report — Audit 2026-05-18

**Phase 7 (Core).** This run is the **instrumentation-code audit half only** — no dashboard access was confirmed at preflight, so the live-data half is deferred. Findings derived here describe what *can* be learned vs. what's tracked. Live-aggregate-grounded findings are out of scope for this run.

See [README.md](README.md#environment-caveats) for environment caveats. Raw inventory in [evidence/instrumentation.csv](evidence/instrumentation.csv).

## Instrumentation density across the site

| Scope | Components | `data-track-*` call sites |
|---|---|---|
| Marketing site (`src/components/site/*`) | 8+ | 23+ (hero, pricing, free-tools, social-proof, demo CTAs) |
| Shared (`src/components/shared/*`) | 4 | 16 (sitewide announcement, click tracker, top header) |
| Starlight docs shell (`src/components/starlight/*`) | 7 files | 2 (only `MobileMenuFooter.astro`) |
| **Docs content (`src/content/docs/docs/**/*.mdx`)** | **59 pages** | **1 site (welcome.mdx, single Book-Demo CTA)** |

**Bottom line:** the marketing surface is well-instrumented; the docs surface is essentially uninstrumented. One CTA on the welcome page tracks `book_demo` (a conversion event). No tracking exists for: page engagement, search use, code-copy, link-out, scroll, helpful/not-helpful, step-completion, integration-connection success, or `/llms.txt` agent fetches.

## Event catalog vs. reality (per `docs/analytics.md`)

The repo includes two analytics docs:
- [`docs/analytics.md`](../../../docs/analytics.md) — 153 lines, PostHog setup notes, a self-aware "Known Issues" list of instrumentation gaps
- [`docs/events.md`](../../../docs/events.md) — 194 lines, a "Marketing Event Glossary" (note the title)

The documented event catalog lists 10 events: `email_captured`, `cta_clicked`, `section_viewed`, `scroll_depth`, `video_played`, `video_progress`, `banner_dismissed`, `pricing_bundle_changed`, `site_searched`, `broken_link_report_submitted`.

**Every one is a marketing event.** None of them is doc-specific. The glossary title (`Marketing Event Glossary`) accurately describes its scope — there is no docs glossary.

The "Known Issues" section in `analytics.md` lists 5 issues:
1. Video tracking is blind
2. No section visibility tracking
3. No scroll depth on blog posts
4. Inconsistent video event names
5. Missing pricing interaction events

None of these is about docs instrumentation, which means the team is *aware* of analytics gaps but hasn't yet recognized the docs surface as a tracking target.

## What CAN be learned today

From the existing setup, the team can answer:
- Did a docs page generate a Book Demo click? (only `welcome.mdx`)
- Did the global announcement banner get dismissed from a docs URL?
- Did the mobile menu footer get used while on a docs page?
- Page-view counts (presumably; PostHog autocaptures these even without explicit `data-track-*`)
- `site_searched` events from the Starlight search box (if instrumented; needs verification at dashboard)

From the existing setup, the team **cannot** answer:
- Which docs pages are completing user tasks vs. dead-ending?
- Where does search fail? (zero-result queries, top searches)
- Are users finding the right page from the welcome landing?
- Which integrations get the most clicks-through? (integration page → `app.gopromptless.ai`)
- Do users copy code samples? Which ones?
- Are external doc-out links being clicked? (28 unique external destinations)
- Are agent crawlers fetching `/llms.txt` or `/llms-full.txt`?
- Is the documented procedure (`<Steps>` block) being followed to completion?
- Are users telling us a page was helpful or not?

## Specific recommendations for closing the gap

Each is a candidate for Phase 14's `tooling-spec.md`. Prioritized by ROI:

1. **Auto-instrument page views with structured properties.** PostHog autocapture already fires on docs pages, but events typically don't carry the page's frontmatter (`slug`, `title`, sidebar section). Add a global layout-level event that fires on docs-page render with `{ page_type: "docs", slug, section, hidden, has_description }` — that single event unlocks per-section, per-page-type analytics for free.

2. **Add a feedback widget (`docs_helpful_voted`).** A simple "Was this helpful?" with thumbs up/down at the bottom of every page. Stores answer + slug. Three weeks of data tells you which pages are bleeding users. Use Posthog Feedback Widget or a custom 30-line component.

3. **Track code-copy events (`docs_code_copied`).** Wrap fenced code blocks with a copy button that emits an event with `{ slug, language, block_index }`. Tells you which examples are actually being used. Particularly valuable for the 17 `<Steps>` procedures.

4. **Track search use (`docs_searched`, `docs_search_zero_result`).** Starlight uses Pagefind by default — capture the query + result-count. Zero-result queries are the highest-signal feedback for content gaps.

5. **Track outbound link clicks (`docs_external_link_clicked`).** Especially for the 28 external links. The pattern is `[text](https://...)` — wrap markdown links with a tracking handler in the layout, or use a single delegated event listener.

6. **Track integration CTA clicks (`docs_integration_connect_clicked`).** The integration pages all link to `app.gopromptless.ai/projects` / `/integrations`. Tracking which integration page generated each click reveals which integrations users *want to* configure, vs. which they read about and don't.

7. **Log `/llms.txt` and `/llms-full.txt` access.** Both are dynamic Astro routes (`src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`) — add a server-side log or analytics call with `{ ua, url }`. Filter by known agent UAs (GPTBot, ClaudeBot, Bingbot, etc.) to measure agent consumption — relevant for an AI documentation product whose customers' agents may be reading the docs.

8. **Per-step completion tracking for `<Steps>` blocks.** Aspirational; lower ROI than the above. Wrap `<Steps>` to emit a `step_visible` event when a user scrolls past each step.

## Phase 7 → Phase 13 handoff

Phase 13 (Journey & task success) cross-references this lens for real-signal grounding. With **no dashboard access this run**, Phase 13's findings are tagged `evidence: instrumentation-only` — they describe gaps that would be visible *if* tracking existed, not gaps the existing tracking has shown. The instrumentation gaps documented above mean Phase 13 cannot validate priority ordering against real usage; it works from inferred journeys only.

## Hard-scope reminder

This audit examines **what is tracked, named, covered, and documented as intent**. It does **not** audit whether emitted payloads are correct, whether listeners fire reliably, or whether PostHog implementation details are sound — those are product-engineering concerns.

## Findings written

Working notes captured in [findings.md](findings.md#phase-7--docs-usage-metrics--instrumentation).

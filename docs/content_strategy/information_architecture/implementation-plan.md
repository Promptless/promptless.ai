---
id: ia-implementation-plan
type: information-architecture
scope: Execution plan to cut over the Docs tab (src/content/docs/docs/) from today's structure to the proposed IA, in incrementally reviewable phases
covers_nav_tab: docs
derived_from: [proposed-ia.md, ia-gap-analysis.md]
companion: [proposed-ia.md, ia-gap-analysis.md]
current_source: src/content/docs/docs/
---

# IA Implementation Plan — Docs tab

**Scope:** How to execute a **full cut-over** from today's Docs-tab structure
(`src/content/docs/docs/`, served at `/docs`) to the [proposed IA](proposed-ia.md),
while keeping every step an **independently reviewable unit**. It operationalizes the
target structure in `proposed-ia.md` and the gap list in
[ia-gap-analysis.md](ia-gap-analysis.md); read both first, since they are the source of truth for
where pages go and what is still missing.

**What "full cut-over" means here.** When this plan finishes, the proposed IA is the live
structure: pages sit at their new slugs, the sidebar reflects the new sections, every net-new
`[NEW]` page the CUJs require exists, and the old concept/configure/how-to grouping is retired.
Nothing ships as a parallel "v2 docs" tree — we migrate the one live tree in place.

**What "incremental review" means here.** We decompose the cut-over into phases, and each
phase is one or a few pull requests a reviewer can evaluate in isolation. The site stays
shippable and internally coherent after every merged PR: the nav resolves, no published URL
404s, and each moved page redirects from its old path. We never merge a change that leaves the
sidebar or redirects in a half-migrated state.

**Deferred by decision — do not build.** Per Manny's review of the proposed IA, a standalone
"Make your docs agent-ready" area (agent-friendliness score, `llms.txt`, an MCP server for docs,
serving Markdown to agents, maintaining agent instructions) is **out of scope** and waits until
the Starport feature ships. The one agent-related capability that ships today, **Doc Detective**,
lives under **Audit & keep your docs healthy** and leads with validating UI procedures (its
largest use), with code samples and API contracts as additional uses. This plan reflects the
post-review IA and does not schedule any agent-ready work.

---

## 1. Cut-over strategy that preserves incremental review

### 1.1 The unit of work is a target section

We sequence the migration **by target section**, in the backbone-journey order that
`proposed-ia.md` defines (start → connect → tune → work the queue → outcomes → scale → audit →
migrate → secure → measure → reference). One phase brings each section fully to its proposed
shape: it re-homes existing pages to their new slugs (setting the `slug`/`sidebar.*` frontmatter
that drives the nav), scaffolds the section's `[NEW]` pages, and adds the redirects in the same
PR. A phase may split into a
few PRs (for example, "move existing pages" separately from "add a large net-new page"), but a
phase never leaves the tree half-built across a merge.

### 1.2 Three moves that every migration PR performs together

Because of how this repo is wired, moving or renaming a page is never a single file operation.
Every migration PR that touches a page's location performs all three of the following, or it is
not mergeable:

1. **Move/rename the content file** under `src/content/docs/docs/` to its new slug path (and fix
   its frontmatter `slug`/`sidebar` fields).
2. **Add a redirect** from the old path to the new path in `src/lib/generated/redirects.json`
   (see §2.2). Old URLs must keep resolving.
3. **Get the page's nav placement from its frontmatter, not from a hand-edited
   `sidebar.json`** (see §1.3). The `slug` and `sidebar.*` fields set in step 1 are what place
   the page in the sidebar; `src/lib/generated/sidebar.json` regenerates from that frontmatter at
   build time. Do **not** hand-edit `sidebar.json` — a hand edit is overwritten on the next
   build. Getting the frontmatter right is the single most important step; it is how pages land in
   (or silently drop out of) the nav in this repo.

### 1.3 Sidebar placement is controlled by page frontmatter, not by hand-editing sidebar.json

**`src/lib/generated/sidebar.json` is auto-generated from page frontmatter — do not hand-edit
it.** `scripts/generate-manifest.ts` rebuilds the file from the docs frontmatter in its
`buildSidebar()` step, and that script runs through `prebuild`/`generate:manifest`, which npm
executes before every `build`. CI and Vercel therefore regenerate the sidebar on each deploy, so
a hand edit to `sidebar.json` never survives — the next build overwrites it.

Control nav placement through each page's **frontmatter** instead. Set `slug` to put the page in
the right section, and set `sidebar.order`, `sidebar.hidden`, and `sidebar.label` for its
ordering, visibility, and label. Adding, moving, renaming, or removing a page is a frontmatter
change, and the sidebar follows from it, so keep the page's frontmatter in the same PR as any
add, move, rename, or removal. To make the committed `sidebar.json` cache reflect the change on
the branch, run `npm run generate:manifest` and commit the regenerated file rather than editing
it by hand. A phase's PR should never carry a hand-authored `sidebar.json` diff.

### 1.4 Keeping the site shippable at every step

Each PR must leave the site in a releasable state. Before a migration PR is marked
review-ready, run the repo's own gates against the changed pages:

- `npm run build` (equivalently `npm run check`) — the nav, route manifest, and content
  collections must build clean.
- The **check-broken-links** workflow against a local `npm run dev` — verify moved pages
  redirect and that no in-repo link 404s after the move.
- `npm run test:smoke` — the smoke suite must stay green.

Because each phase is self-contained (its pages, its redirects, its sidebar slice), a reviewer
can reason about it without holding the whole migration in their head, and the tree is
shippable whether or not later phases have merged.

---

## 2. Content mapping → moves

The backbone of the cut-over is the current→proposed page mapping from
[ia-gap-analysis.md](ia-gap-analysis.md), reconciled here against the actual files in
`src/content/docs/docs/`. The tables below group every existing page by the **phase** that moves
it, so each phase is a coherent, reviewable slice.

### 2.1 Current pages → target section (grouped by migration phase)

Slugs below are the current `docs/...` slugs; new slugs are proposed and finalized in Phase 0
(§3). "Landing" pages are current section index pages that become the new section's index.

| Current page (`/docs/…`) | Target section | Notes |
|---|---|---|
| `getting-started/welcome` | Start here → Welcome | Rehome. |
| `getting-started/core-concepts` + `core-concepts/*` (`triggers`, `context-sources`, `doc-locations`) | Start here → How Promptless works | **Consolidate duplication** — concepts currently live under both `getting-started/` and `core-concepts/`; merge into one home. |
| `getting-started/pilot-overview` | Start here → Run a pilot | Pairs with the new pilot-success rubric (§4, P2). |
| `getting-started/setup-quickstart` | Start here → Quickstart | Rehome. |
| `getting-started/promptless-oss` | Start here → Open-source quickstart | Pairs with the OSS read-only install path (§4, P2). |
| `getting-started/promptless-1-0` | Changelog **or** fold into How Promptless works | Launch note, not a journey page (gap analysis §3). Decide in Phase 0; if moved to changelog, redirect the old docs URL. |
| `integrations/github-integration` · `github-enterprise-integration` · `bitbucket-integration` | Connect your stack → Source control & access scope | Also remain in Reference → Integrations reference (per-integration detail). |
| `configuring-promptless/triggers/*` (`git-hub-p-rs`, `git-hub-commits`, `git-hub-issues`, `git-lab-merge-requests`, `slack-messages`, `microsoft-teams-messages`, `intercom-tickets-beta`, `api-triggers`) | Connect your stack → Triggers | Rehome the trigger set. |
| `configuring-promptless/context-sources/*` (`jira`, `linear`, `confluence`, `notion`, `google-drive`, `slite`) · `integrations/atlassian-integration` · `integrations/linear-integration` | Connect your stack → Context sources | Rehome. |
| `configuring-promptless/doc-collections/git-hub-repos-docs-as-code` · `how-promptless-learns-your-docs` | Connect your stack → Doc locations & collections | Rehome. |
| `configuring-promptless/configuration-reference` | Reference & help → Reference (config) | Not in the original mapping; belongs with reference material. |
| `configuring-promptless/customizing-notifications` | Tune → Notifications | Rehome. |
| `integrations/launchdarkly-integration-beta` | Tune → Release timing & feature flags | Feeds the general release-timing model (§4, P0); also stays in Integrations reference. |
| `how-to-use-promptless/providing-feedback` | Tune → Teaching conventions (also Work the queue) | Cross-linked from the review queue. |
| `how-to-use-promptless/using-the-web-interface` | Work the queue → Web interface / inbox | Rehome. |
| `how-to-use-promptless/interacting-with-promptless-p-rs` | Work the queue → Reviewing & editing PRs | Rehome. |
| `how-to-use-promptless/working-with-slack` · `integrations/slack-integration` · `microsoft-teams-integration` · `intercom-integration-beta` | Work the queue → Reviewing from Slack / Teams (+ Connect → Triggers) | Rehome the reviewing flow; integration setup stays in Integrations reference. |
| `how-to-use-promptless/using-promptless-capture` | Get the most out of → Keep screenshots current | Pairs with screenshot-depth expansion (§4, P0). |
| `how-to-use-promptless/deep-analysis` | Get the most out of → Pay down docs debt | Rehome. |
| `how-to-use-promptless/agent-knowledge-base` | Get the most out of → Build an agent knowledge base | Rehome. |
| `how-to-use-promptless/managing-environment-variables` | Scale across teams → Managing environment variables | Rehome. |
| `configuring-promptless/doc-collections/doc-detective-integration` | Audit & keep your docs healthy → Validate UI procedures, code samples & API contracts (Doc Detective) | Reframed per review: **UI-procedure validation first.** No agent-ready section. |
| `configuring-promptless/doc-collections/vale-integration` | Audit & keep your docs healthy → Standards & template enforcement | Not in the original mapping; style/standards enforcement fits the audit-and-health section. |
| `security-and-privacy/*` (`compliance-and-certifications`, `data-handling-and-classification`, `network-architecture`, `promptless-subprocessors`, `single-sign-on-sso-setup`, `privacy-policy`) | Security & deployment | Best-covered tree; largely intact rehome. |
| `self-hosting` · `self-hosting/kubernetes-helm` | Security & deployment → Self-hosting | Rehome under the security tree. |
| `integrations/*` (full set incl. `gitlab-integration`) | Reference & help → Integrations reference | Per-integration detail stays here even where a page is also surfaced in a journey section. |
| `frequently-asked-questions/frequently-asked-questions` | Reference & help → FAQ | Rehome. |
| `account-management/account-management` | Reference & help → Account management | Rehome. |
| `getting-started/getting-help` | Reference & help → Getting help | Rehome. |
| `media-kit` · `marketing-images` | Unchanged (out of Docs-tab IA scope) | Reference/brand assets, not journey pages; leave in place and out of the new nav sections. |

### 2.2 Redirect / URL preservation

This repo already has a redirect mechanism — use it; do not invent a new one.

- **Where:** `src/lib/generated/redirects.json`, an array of
  `{ "source", "destination", "permanent": true }` entries. `astro.config.mjs` imports it and
  spreads it into Starlight's `redirects` map alongside the hand-listed short redirects.
- **The file is not regenerated by a script** (no generator writes it), so treat it as a
  hand-maintained artifact: every moved or renamed page adds a `source` → `destination` entry in
  the same PR as the move, with `permanent: true`.
- **Rule:** any page whose slug changes gets a redirect from its old `/docs/...` path to its new
  one. Renames and section moves both count. Consolidations (for example, the concepts
  duplication) redirect every retired path to the surviving page.
- **Verify:** run the **check-broken-links** workflow after each move so redirects resolve and no
  internal link points at a dead old path.

---

## 3. Phasing & ordering

Phases run in backbone-journey order. Each phase = one reviewable slice (one or a few PRs);
later phases depend only on the Phase 0 conventions, not on each other, so sections can be
reviewed and merged largely independently.

### Phase 0 — Scaffolding & conventions (no page moves)

Establishes the rules so every later phase is mechanical and reviewable. Deliverables:

- **Finalized new slugs** for every target section and page (fill in the "new slug" column left
  open in §2.1), agreed before any content moves.
- **Section index pages**: confirm which current landing pages (`how-to-use-promptless.mdx`,
  `integrations.mdx`, `configuring-promptless` indexes) become which new section indexes, and
  which new sections need a fresh index page.
- **`promptless-1-0` disposition** decided (changelog vs. fold into How Promptless works).
- **Frontmatter + redirect checklist** adopted as the definition-of-done for every migration PR
  (§1.2–§1.4): each moved page carries the `slug`/`sidebar.*` frontmatter that drives its nav
  placement (the sidebar regenerates from it at build), plus a redirect entry — no hand-edited
  `sidebar.json` diffs.
- **CI gate confirmed**: `npm run build`, smoke tests, and the broken-link check run on each PR.

This phase changes no published page location, so it is safe to merge first and de-risks
everything after it.

### Phases 1–11 — Section-by-section cut-over

| Phase | Target section | Moves (from §2.1) | Net-new pages introduced (from §4) |
|---|---|---|---|
| 1 | Start here | welcome, concepts consolidation, pilot-overview, setup-quickstart, promptless-oss, promptless-1-0 disposition | Pilot success rubric (P2), OSS read-only install path (P2) |
| 2 | Connect your stack | source-control integrations, triggers/*, context-sources/*, doc-collections (locations) | Source control & access scope (P0/P1), Connection health & troubleshooting (P0) |
| 3 | Tune what Promptless suggests | customizing-notifications, launchdarkly, providing-feedback | Noise & relevance filtering (P0), Release timing & feature flags — general model (P0) |
| 4 | Work the queue | using-the-web-interface, interacting-with-promptless-p-rs, working-with-slack / Teams review | Assignment & routing / auto-assign (P0) |
| 5 | Get the most out of Promptless | using-promptless-capture, deep-analysis, agent-knowledge-base | Screenshot depth (P0), Release notes & changelogs (P1), Localization (P2) |
| 6 | Scale across teams | managing-environment-variables | Multi-repo routing (P1), Versioned docs (P1) |
| 7 | Audit & keep your docs healthy | doc-detective-integration (UI-procedure-first), vale-integration | Content audit (P2), Remediate at scale (P2), Standards/template enforcement (P2), Restructure/IA-overhaul guidance (P2) |
| 8 | Migrate to docs-as-code *(new section)* | — | Why docs-as-code, Choosing a platform, Per-source migration guides, Preserving URLs & redirects (all P1) |
| 9 | Security & deployment | security-and-privacy/*, self-hosting/* | Access & permissions / read-only posture (P1) |
| 10 | Measure impact *(new section)* | — | Reporting & ROI (P1/P2) |
| 11 | Reference & help | integrations/* (full set), FAQ, account-management, getting-help, configuration-reference | — |

**How incremental review works across phases:**

- Within a phase, **moves land before net-new pages.** Rehoming existing pages (a
  frontmatter-and-redirect diff) is easy to review; net-new `[NEW]` pages are each their own PR
  slotted into the already-migrated section. A large section may therefore be one "moves" PR
  plus several small "new page" PRs.
- **Ordering is by leverage where it matters.** P0 gaps cluster in Phases 2–5 (connection
  health, noise/timing, auto-assign, screenshot depth) — the areas the corpus shows decide pilot
  retention — so they can be prioritized even before lower-leverage sections migrate.
- **Sections are loosely coupled.** After Phase 0, a reviewer can take Phase 3 without waiting on
  Phase 2, because each phase ships its own coherent sidebar slice and redirects. Cross-links
  between sections are updated as targets move (caught by the broken-link check).

---

## 4. Doc-gap backlog (net-new pages)

Every `[NEW]` item from [ia-gap-analysis.md](ia-gap-analysis.md), turned into a discrete,
independently reviewable page and slotted into the phase that owns its section. Priority tiers
(P0/P1/P2) are carried straight from the gap analysis. The agent-friendly `llms.txt` / SDK-accuracy
gap is intentionally **absent** — it was removed with the deferred agent-ready section.

| Gap (net-new page) | Priority | Phase / section | Serves CUJ |
|---|---|---|---|
| Noise & relevance filtering | P0 | 3 · Tune | calibrate-suggestions |
| Release timing & feature flags (general model) | P0 | 3 · Tune | calibrate-suggestions, release-notes |
| Connection health & troubleshooting | P0 | 2 · Connect your stack | connect-sources |
| Assignment & routing (auto-assign) | P0 | 4 · Work the queue | triage-review-queue |
| Screenshot depth (auth-to-target, firewalled/test envs, annotations) | P0 | 5 · Get the most out of | screenshots |
| Migrate to docs-as-code (platform choice + per-source guides + redirects) | P1 | 8 · Migrate to docs-as-code | migrate-to-docs-as-code |
| Multi-repo routing | P1 | 6 · Scale across teams | multi-repo-routing |
| Versioned docs | P1 | 6 · Scale across teams | multi-repo-routing |
| Access & permissions (read-only / least-privilege posture) | P1 | 9 · Security & deployment (+ 2 · Connect) | connect-sources, enterprise-security-review |
| Release notes & changelogs | P1 | 5 · Get the most out of | release-notes |
| Localization (locale modeling, propagation, TMS/Phrase) | P2 | 5 · Get the most out of | localization |
| Reporting & ROI | P2 | 10 · Measure impact | prove-value |
| Content audit (surface stale/inconsistent pages) | P2 | 7 · Audit & keep your docs healthy | remediate-legacy-content, overhaul-ia |
| Remediate existing pages at scale | P2 | 7 · Audit & keep your docs healthy | remediate-legacy-content |
| Standards & template enforcement across legacy content | P2 | 7 · Audit & keep your docs healthy | remediate-legacy-content |
| Restructure / IA-overhaul guidance | P2 | 7 · Audit & keep your docs healthy | overhaul-ia |
| Pilot success rubric (exit metrics) | P2 | 1 · Start here | evaluate-pilot |
| OSS read-only install path | P2 | 1 · Start here | oss-onboarding |

**Suggested authoring order:** clear the **P0** set first (they gate pilot success and land in
Phases 2–5), then **P1** (deal-gating: migration, multi-repo/versioned routing, access posture,
release notes), then **P2**. A net-new page is only authored once its home section has migrated,
so its sidebar entry and redirects land in a coherent nav.

---

## 5. Cut-over completion & retirement

The cut-over is **done** when all of the following hold:

- Every current page in §2.1 resolves at its new slug, and every old path returns a redirect (no
  `/docs/...` 404s) — verified by the broken-link check against a full crawl.
- The concepts duplication is consolidated to a single "How Promptless works" home, with the
  retired `getting-started/core-concepts` and `core-concepts/*` paths redirected.
- Every P0 and P1 gap page from §4 exists and is linked from its section; P2 pages are tracked as
  remaining backlog but do not block cut-over.
- The generated `src/lib/generated/sidebar.json` lists **only** the new sections in backbone
  order, with no leftover old grouping — which follows from every page's frontmatter being set to
  its new placement, since the sidebar regenerates from that frontmatter on each build.

**Retiring the old structure:**

- Remove the old section landing pages and grouping that no longer have a home
  (`how-to-use-promptless.mdx` and the old `configuring-promptless`/`integrations` index shells)
  once their children have moved, redirecting each retired index URL to its successor section
  index.
- Delete emptied directories under `src/content/docs/docs/` after their pages have moved.
- Do a final pass on `redirects.json` to confirm no old path is orphaned, then run
  `npm run generate:manifest` and confirm the regenerated `sidebar.json` is the proposed IA and
  nothing else (fix any stray entry by correcting the offending page's frontmatter, not the
  generated file).
- Update `AGENTS.md`'s Documentation Map and the `docs/content_strategy/` references so the repo's
  own map reflects the new structure.

At that point the proposed IA is the live IA, the old concept/configure/how-to structure no
longer exists, and old URLs still resolve — a full cut-over reached through a sequence of
independently reviewable phases.

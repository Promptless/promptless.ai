---
id: ia-phase-0-conventions
type: information-architecture
scope: Phase 0 of the IA cut-over — the finalized slugs, section-index and promptless-1-0 dispositions, and the migration definition-of-done that every later phase follows. Moves no published page.
covers_nav_tab: docs
derived_from: [implementation-plan.md, proposed-ia.md, ia-gap-analysis.md]
companion: [implementation-plan.md, proposed-ia.md, ia-gap-analysis.md]
current_source: src/content/docs/docs/
---

# Phase 0 — Scaffolding & Conventions

**Scope:** This is Phase 0 of the [IA implementation plan](implementation-plan.md). It settles the
decisions every later phase depends on and **moves no published page**: no content file changes
location, no on-disk slug changes, and the live nav stays untouched. Merging it is safe because
nothing readers can reach changes. It produces the shared contract — finalized slugs, index and
launch-note dispositions, and a migration definition-of-done — that makes Phases 1–11 mechanical
and independently reviewable.

Read [proposed-ia.md](proposed-ia.md) for the target structure and
[ia-gap-analysis.md](ia-gap-analysis.md) for the current→proposed mapping; this file operationalizes
both. Where either disagrees with what is actually on disk in `src/content/docs/docs/`, the on-disk
inventory taken for this phase (below) wins.

---

## 1. Finalized slugs

The [implementation plan §2.1](implementation-plan.md) left the "new slug" column open for Phase 0
to fill. It is filled below. Every current page maps to exactly one destination slug, and every
net-new page from the [gap backlog](implementation-plan.md) gets its slug reserved now so its
redirect and sidebar entry land in a coherent nav when it is authored.

**Conventions the slugs follow:**

- Each proposed top-level section gets a **short, stable slug prefix** (the `Section prefix`
  column). Leaf slugs are `docs/<section-prefix>/<leaf>`.
- Leaf names are kebab-case and drop the mangled auto-generated forms currently on disk
  (`git-hub-p-rs` → `github-prs`, and so on). Because every rename ships with a redirect (§3), the
  old path keeps resolving, so cleaning the leaf name is free.
- The `docs/` root prefix and the `/docs` served path are unchanged; only the second segment and
  below move.

### 1.1 Section prefixes (backbone-journey order)

| # | Proposed section | Section prefix (`docs/…`) |
|---|---|---|
| 1 | Start here | `start-here` |
| 2 | Connect your stack | `connect` |
| 3 | Tune what Promptless suggests | `tune` |
| 4 | Work the queue | `work-the-queue` |
| 5 | Get the most out of Promptless | `get-the-most-out` |
| 6 | Scale across teams | `scale` |
| 7 | Audit & keep your docs healthy | `audit` |
| 8 | Migrate to docs-as-code | `migrate` |
| 9 | Security & deployment | `security` |
| 10 | Measure impact | `measure` |
| 11 | Reference & help | `reference` |

### 1.2 Existing pages → finalized destination slug

Every file currently under `src/content/docs/docs/` (verified against the tree on `main`), with the
phase that moves it. `[NEW]` pages are **not** here — they are reserved in §1.3.

| Current slug (`docs/…`) | Finalized slug (`docs/…`) | Phase |
|---|---|---|
| `getting-started/welcome` | `start-here/welcome` | 1 |
| `getting-started/core-concepts` + `core-concepts` + `core-concepts/triggers` + `core-concepts/context-sources` + `core-concepts/doc-locations` | `start-here/how-promptless-works` *(consolidated — all retired paths redirect here)* | 1 |
| `getting-started/pilot-overview` | `start-here/run-a-pilot` | 1 |
| `getting-started/setup-quickstart` | `start-here/quickstart` | 1 |
| `getting-started/promptless-oss` | `start-here/open-source-quickstart` | 1 |
| `getting-started/promptless-1-0` | *retired — folded into `start-here/how-promptless-works` (see §2)* | 1 |
| `configuring-promptless/triggers` *(index)* | `connect/triggers` *(subgroup index)* | 2 |
| `configuring-promptless/triggers/git-hub-p-rs` | `connect/triggers/github-prs` | 2 |
| `configuring-promptless/triggers/git-hub-commits` | `connect/triggers/github-commits` | 2 |
| `configuring-promptless/triggers/git-hub-issues` | `connect/triggers/github-issues` | 2 |
| `configuring-promptless/triggers/git-lab-merge-requests` | `connect/triggers/gitlab-merge-requests` | 2 |
| `configuring-promptless/triggers/slack-messages` | `connect/triggers/slack-messages` | 2 |
| `configuring-promptless/triggers/microsoft-teams-messages` | `connect/triggers/microsoft-teams-messages` | 2 |
| `configuring-promptless/triggers/intercom-tickets-beta` | `connect/triggers/intercom-tickets` | 2 |
| `configuring-promptless/triggers/api-triggers` | `connect/triggers/api` | 2 |
| `configuring-promptless/context-sources` *(index)* | `connect/context-sources` *(subgroup index)* | 2 |
| `configuring-promptless/context-sources/jira` | `connect/context-sources/jira` | 2 |
| `configuring-promptless/context-sources/linear` | `connect/context-sources/linear` | 2 |
| `configuring-promptless/context-sources/confluence` | `connect/context-sources/confluence` | 2 |
| `configuring-promptless/context-sources/notion` | `connect/context-sources/notion` | 2 |
| `configuring-promptless/context-sources/google-drive` | `connect/context-sources/google-drive` | 2 |
| `configuring-promptless/context-sources/slite` | `connect/context-sources/slite` | 2 |
| `configuring-promptless/doc-collections/git-hub-repos-docs-as-code` | `connect/doc-locations/github-repos` | 2 |
| `configuring-promptless/doc-collections/how-promptless-learns-your-docs` | `connect/doc-locations/how-promptless-learns-your-docs` | 2 |
| `configuring-promptless/customizing-notifications` | `tune/notifications` | 3 |
| `how-to-use-promptless/providing-feedback` | `tune/teaching-conventions` *(cross-linked from Work the queue)* | 3 |
| `how-to-use-promptless/using-the-web-interface` | `work-the-queue/web-interface` | 4 |
| `how-to-use-promptless/interacting-with-promptless-p-rs` | `work-the-queue/reviewing-prs` | 4 |
| `how-to-use-promptless/working-with-slack` | `work-the-queue/reviewing-from-slack-and-teams` | 4 |
| `how-to-use-promptless/using-promptless-capture` | `get-the-most-out/screenshots` | 5 |
| `how-to-use-promptless/deep-analysis` | `get-the-most-out/pay-down-docs-debt` | 5 |
| `how-to-use-promptless/agent-knowledge-base` | `get-the-most-out/agent-knowledge-base` | 5 |
| `how-to-use-promptless/managing-environment-variables` | `scale/environment-variables` | 6 |
| `configuring-promptless/doc-collections/doc-detective-integration` | `audit/doc-detective` | 7 |
| `configuring-promptless/doc-collections/vale-integration` | `audit/standards-enforcement` | 7 |
| `security-and-privacy/compliance-and-certifications` | `security/compliance-and-certifications` | 9 |
| `security-and-privacy/data-handling-and-classification` | `security/data-handling-and-classification` | 9 |
| `security-and-privacy/network-architecture` | `security/network-architecture` | 9 |
| `security-and-privacy/promptless-subprocessors` | `security/subprocessors` | 9 |
| `security-and-privacy/single-sign-on-sso-setup` | `security/single-sign-on` | 9 |
| `security-and-privacy/privacy-policy` | `security/privacy-policy` | 9 |
| `self-hosting` *(index)* | `security/self-hosting` | 9 |
| `self-hosting/kubernetes-helm` | `security/self-hosting/kubernetes-helm` | 9 |
| `integrations` *(index)* | `reference/integrations` *(subgroup index)* | 11 |
| `integrations/github-integration` | `reference/integrations/github` | 11 |
| `integrations/github-enterprise-integration` | `reference/integrations/github-enterprise` | 11 |
| `integrations/bitbucket-integration` | `reference/integrations/bitbucket` | 11 |
| `integrations/gitlab-integration` | `reference/integrations/gitlab` | 11 |
| `integrations/atlassian-integration` | `reference/integrations/atlassian` | 11 |
| `integrations/linear-integration` | `reference/integrations/linear` | 11 |
| `integrations/slack-integration` | `reference/integrations/slack` | 11 |
| `integrations/launchdarkly-integration-beta` | `reference/integrations/launchdarkly` | 11 |
| `integrations/microsoft-teams-integration` | `reference/integrations/microsoft-teams` | 11 |
| `integrations/intercom-integration-beta` | `reference/integrations/intercom` | 11 |
| `configuring-promptless/configuration-reference` | `reference/configuration-reference` | 11 |
| `frequently-asked-questions/frequently-asked-questions` | `reference/faq` | 11 |
| `account-management/account-management` | `reference/account-management` | 11 |
| `getting-started/getting-help` | `reference/getting-help` | 11 |
| `media-kit` | `media-kit` *(unchanged — out of Docs-tab IA scope)* | — |
| `marketing-images` | `marketing-images` *(unchanged — out of Docs-tab IA scope)* | — |

### 1.3 Reserved slugs for net-new pages

Reserved now so each `[NEW]` page from the [gap backlog](implementation-plan.md) drops into its
section with a ready slug, sidebar slot, and (where a retired path feeds it) redirect. Priority and
authoring phase are carried from the plan.

| Net-new page | Reserved slug (`docs/…`) | Priority | Phase |
|---|---|---|---|
| Source control & access scope | `connect/source-control` | P0/P1 | 2 |
| Connection health & troubleshooting | `connect/connection-health` | P0 | 2 |
| Noise & relevance filtering | `tune/noise-filtering` | P0 | 3 |
| Release timing & feature flags (general model) | `tune/release-timing` | P0 | 3 |
| Assignment & routing (auto-assign) | `work-the-queue/assignment-and-routing` | P0 | 4 |
| Generate release notes & changelogs | `get-the-most-out/release-notes` | P1 | 5 |
| Keep translations current (localization) | `get-the-most-out/localization` | P2 | 5 |
| Multi-repo routing | `scale/multi-repo-routing` | P1 | 6 |
| Versioned docs | `scale/versioned-docs` | P1 | 6 |
| Audit existing content for staleness | `audit/content-audit` | P2 | 7 |
| Remediate & restandardize legacy pages | `audit/remediate-at-scale` | P2 | 7 |
| Restructure your information architecture | `audit/restructure-ia` | P2 | 7 |
| Why docs-as-code | `migrate/why-docs-as-code` | P1 | 8 |
| Choosing a platform | `migrate/choosing-a-platform` | P1 | 8 |
| Per-source migration guides | `migrate/migration-guides` | P1 | 8 |
| Preserving URLs & redirects | `migrate/preserving-urls-and-redirects` | P1 | 8 |
| Access & permissions (read-only posture) | `security/access-and-permissions` | P1 | 9 |
| Reporting & ROI | `measure/reporting-and-roi` | P1/P2 | 10 |
| Pilot success rubric | `start-here/pilot-success-rubric` | P2 | 1 |
| OSS read-only install path | `start-here/open-source-install` | P2 | 1 |

> The `standards-enforcement` audit page (§1.2) is the migrated Vale page, not a net-new page; the
> gap-backlog "Standards & template enforcement across legacy content" (P2) is authored into that
> same page rather than as a separate slug.

---

## 2. Dispositions

### 2.1 Section indexes

**Top-level sections are Starlight sidebar container groups, not pages.** This matches how the nav
already works today — "Getting Started" and "Configuring Promptless" are group containers with no
group-level index route. The generator derives these containers from the slug path segments, so a
section is just a labeled group whose `items` are the pages listed in §1. **No per-section index
page is required**, and none is created. A container's label comes from its index page's
`sidebar.label ?? title` when one exists, or a title-cased slug segment otherwise
(`scripts/generate-manifest.ts`); where a section wants a specific group label without an index
page, that is a generator/label concern to settle when the section migrates, not a reason to author
an index page here.

Consequences for the current landing / index pages:

| Current landing/index | Disposition |
|---|---|
| `core-concepts` (hidden index) + `core-concepts/*` + `getting-started/core-concepts` | Consolidated into `start-here/how-promptless-works`; all retired paths redirect there (Phase 1). |
| `configuring-promptless/triggers` (index) | Kept as the **Triggers subgroup index** at `connect/triggers` (Phase 2). |
| `configuring-promptless/context-sources` (index) | Kept as the **Context sources subgroup index** at `connect/context-sources` (Phase 2). |
| `integrations` (index) | Kept as the **Integrations reference subgroup index** at `reference/integrations` (Phase 11). |
| `how-to-use-promptless` (landing) | Retired — its children split across Tune, Work the queue, and Get the most out. Redirect the old landing URL to the most representative successor page (`work-the-queue/web-interface`), finalized in the phase that retires it. |

There is no `configuring-promptless` landing page or `doc-collections` index on disk, so none needs
a disposition. Where a subgroup keeps an index (`connect/triggers`, `connect/context-sources`,
`reference/integrations`), that index page moves like any other page in §1.2 — updated content file
and frontmatter, plus a redirect — and its sidebar entry regenerates from that frontmatter (§3).

### 2.2 `promptless-1-0` — fold into "How Promptless works"

The [gap analysis §3](ia-gap-analysis.md) flagged `getting-started/promptless-1-0` as "not a
journey page — move to Changelog or fold into How Promptless works." **Decision: fold
`promptless-1-0` into `start-here/how-promptless-works` and retire the standalone page**,
redirecting the old path there in Phase 1.

Folding beats moving to the changelog:

- The changelog is a dated, monthly-entry collection for incremental shipped changes
  (`src/content/changelog/changelogs/*.mdx`), but the 1.0 page is a launch narrative with an
  embedded video and no natural month bucket, so it fits neither the format nor the collection's
  purpose.
- Its durable value — what Promptless does and how teams use it — is exactly the "How Promptless
  works" concept material, so folding keeps that value and drops the stale-dating launch framing.
- The [proposed IA](proposed-ia.md) lists "Start here" with five journey pages and **no** standalone
  "Promptless 1.0" entry, so the page does not survive as its own slug.

The embedded launch video and any still-accurate positioning are preserved by carrying them into
`start-here/how-promptless-works` during Phase 1; the launch URL keeps resolving via the redirect.

---

## 3. Migration definition-of-done (adopted for every later phase)

Every migration PR in Phases 1–11 is **not review-ready** until all of the following hold. This
adapts [implementation plan §1.2–§1.4](implementation-plan.md) to how the repo actually builds the
nav today (see the note below on the plan's stale sidebar assumption).

**For every page a PR adds, moves, renames, or removes:**

1. **Content file** is at its finalized slug under `src/content/docs/docs/` (§1), with frontmatter
   updated to match: `slug` set to the new path, and `sidebar.order` / `sidebar.hidden` /
   `sidebar.label` set so the page lands in the right group, position, and label. **The nav is
   driven entirely by this frontmatter** — placement in a section comes from the slug's path
   segments, ordering from `sidebar.order`, visibility from `sidebar.hidden`, and the label from
   `sidebar.label ?? title`.
2. **Redirect added** in `src/lib/generated/redirects.json` — a `{ "source", "destination",
   "permanent": true }` entry from every retired `/docs/...` path to its destination. Consolidations
   redirect *every* retired path to the surviving page. This file **is hand-maintained** — no script
   writes it; `astro.config.mjs` imports and spreads it.
3. **Sidebar regenerated, not hand-edited.** `src/lib/generated/sidebar.json` is a build artifact
   generated from frontmatter by `scripts/generate-manifest.ts` (run via `generate:manifest` /
   `prebuild`, which fires automatically before every `astro build`). Drive nav changes through the
   page frontmatter in step 1; do **not** hand-edit `sidebar.json`, because the next build
   overwrites it. Run `npm run generate:manifest` and commit the regenerated `sidebar.json` /
   `route-manifest.json` so the checked-in artifact matches the frontmatter in the same PR.
4. **Short redirect map checked**: if a moved page is a target of a hand-listed redirect in
   `astro.config.mjs` (for example `'/docs'` → `getting-started/welcome`, `'/oss'` →
   `getting-started/promptless-oss`), update that entry in the same PR so the short link still lands
   on the page.

**Before the PR is marked review-ready, run the repo's gates against the changed pages:**

- `npm run check` (`astro check` + `astro build`, which runs `prebuild` → `generate:manifest`
  first) — content collections, routes, the regenerated nav, and the build must be clean. This is
  what CI enforces (`.github/workflows/check.yml`).
- `npm run test:smoke` — the smoke suite must stay green. Also CI-enforced.
- The **check-broken-links** workflow against a local `npm run dev` — confirm every moved page
  redirects and no in-repo link 404s after the move. This is a **local** verification skill, **not**
  a CI job; run it locally before requesting review. (The `doc-detective` workflow is
  `workflow_dispatch`-only and is unrelated to migration link integrity.)

A phase's PR is coherent only when the regenerated `sidebar.json` and the hand-edited
`redirects.json` match its content-and-frontmatter diff exactly — same set of pages, no more and no
less.

> **The plan's "hand-maintained sidebar" premise is stale.** [Implementation plan §1.3](implementation-plan.md)
> and the org-wide sidebar-maintenance guidance both state `sidebar.json` is hand-maintained and not
> regenerated by any script. That was true before PR #608 (merged 2026-06-25), which added
> sidebar generation to `scripts/generate-manifest.ts` specifically "so the nav can no longer
> silently drift from the content files." Post-#608, a hand edit to `sidebar.json` is overwritten on
> the next build; the correct mechanic is frontmatter-driven, as codified above. Only
> `redirects.json` remains genuinely hand-maintained. The repo's own `AGENTS.md` "Key Conventions"
> already documents the correct auto-generated behavior. The plan text and the org guidance should be
> updated to match; that correction is tracked as a follow-up, not made in this content artifact.

---

## 4. What this phase does **not** do

- It moves no page, changes no on-disk slug, and edits no published content. The finalized slugs in
  §1 are decisions; they are applied in Phases 1–11.
- It does not build any `[NEW]` page. Those slugs are reserved (§1.3), not authored.
- It does not touch `sidebar.json`, `route-manifest.json`, or `redirects.json` — no page has moved
  yet, so there is nothing to regenerate or redirect.
- It changes no repo code or agent-facing convention. The repo's `AGENTS.md` "Key Conventions"
  already documents the correct (auto-generated) sidebar behavior, so no edit is needed there; the
  stale sidebar premise lives in the [implementation plan](implementation-plan.md) and the org
  sidebar-maintenance guidance, whose correction is tracked as a follow-up (see §3). The broader
  `AGENTS.md` Documentation Map rewrite to reflect the new section structure stays with cut-over
  completion ([implementation plan §5](implementation-plan.md)).

---
id: ia-gap-analysis
type: information-architecture
scope: Gaps between the CUJ-driven proposed Docs IA and current src/content/docs/docs/
covers_nav_tab: docs
companion: proposed-ia.md
current_source: src/content/docs/docs/
---

# IA Gap Analysis — Docs tab

**Scope:** Compares the [CUJ-driven proposed IA](proposed-ia.md) against the **current** Docs-tab
content in `src/content/docs/docs/`. Two outputs: (1) content the journeys require that **does
not exist** (`[NEW]`), and (2) current pages that **map to no CUJ** (review for prune/keep).
This gap list is the intended deliverable — it shows where docs must grow to serve real users.

## 1. Current → proposed mapping (existing pages keep a home)

| Current page (under `/docs/`) | Proposed section |
|---|---|
| getting-started/welcome | Start here → Welcome |
| getting-started/core-concepts · core-concepts/* | Start here → How Promptless works |
| getting-started/pilot-overview | Start here → Run a pilot |
| getting-started/setup-quickstart | Start here → Quickstart |
| getting-started/promptless-oss | Start here → Open-source quickstart |
| getting-started/getting-help | Reference & help → Getting help |
| integrations/github-integration · github-enterprise-integration · bitbucket-integration | Connect your stack → Source control |
| configuring-promptless/triggers/* | Connect your stack → Triggers |
| configuring-promptless/context-sources/* · integrations/atlassian-integration · linear-integration | Connect your stack → Context sources |
| configuring-promptless/doc-collections/git-hub-repos-docs-as-code · how-promptless-learns-your-docs | Connect your stack → Doc locations & collections |
| configuring-promptless/customizing-notifications | Tune → Notifications |
| integrations/launchdarkly-integration-beta | Tune → Release timing & feature flags |
| how-to-use-promptless/providing-feedback | Tune → Teaching conventions (also Work the queue) |
| how-to-use-promptless/using-the-web-interface | Work the queue → web interface / inbox |
| how-to-use-promptless/interacting-with-promptless-p-rs | Work the queue → Reviewing & editing PRs |
| how-to-use-promptless/working-with-slack · integrations/slack-integration · microsoft-teams-integration · intercom-integration-beta | Work the queue → Slack/Teams (+ Connect → Triggers) |
| how-to-use-promptless/using-promptless-capture | Get the most out of → Screenshots |
| how-to-use-promptless/deep-analysis | Get the most out of → Deep Analysis |
| configuring-promptless/doc-collections/doc-detective-integration | Get the most out of → Agent-friendly docs |
| how-to-use-promptless/agent-knowledge-base | Get the most out of → Agent knowledge base |
| how-to-use-promptless/managing-environment-variables | Scale across teams → Env variables |
| security-and-privacy/* | Security & deployment |
| self-hosting · self-hosting/kubernetes-helm | Security & deployment → Self-hosting |
| integrations/* (full set) | Reference & help → Integrations reference |
| frequently-asked-questions/frequently-asked-questions | Reference & help → FAQ |
| account-management/account-management | Reference & help → Account management |

## 2. `[NEW]` — content the CUJs require that does not exist

Ordered by leverage (impact on pilot success / deals × frequency in the corpus).

| Gap (new page/area) | Serves CUJ | Why it matters (evidence) | Priority |
|---|---|---|---|
| **Noise & relevance filtering** | calibrate-suggestions | Pilots die on day-one noise; suppress internal-only/self-evident changes (multiple customers) | P0 |
| **Release timing & feature flags** (general model, not just feature-flag integrations) | calibrate-suggestions, release-notes | Most-cited unsolved workflow: map release stage → suggestion status; "drafted too early" (multiple customers) | P0 |
| **Connection health & troubleshooting** | connect-sources | Silent token/auth failures produce zero suggestions and kill pilots invisibly (a customer) | P0 |
| **Assignment & routing (auto-assign)** | triage-review-queue | #1 ask of engineer-owned teams; "no one owns the queue" (multiple customers) | P0 |
| **Screenshot depth: auth-to-target, firewalled/test envs, annotations** | screenshots | Top requested capability; concrete blockers stall pilots (auth flows for one, firewall/color for another) | P0 |
| **Migrate to docs-as-code** (platform choice + per-source guides + redirects) | migrate-to-docs-as-code | Gates many deals; teams stuck on Doc360/ReadMe/Fern/HubSpot/RoboHelp | P1 |
| **Multi-repo routing** | multi-repo-routing | Routing bugs across orgs/collections erode trust (one customer; another with 6+ orgs) | P1 |
| **Versioned docs** | multi-repo-routing | Map changes to correct version set (parallel major versions; enterprise parallel versions) | P1 |
| **Access & permissions (read-only/least-privilege posture)** | connect-sources, enterprise-security-review | Recurring security/IT gating; ties access scope to the security story | P1 |
| **Release notes & changelogs** | release-notes | No release-notes process is common; explicit demand (multiple customers) | P1 |
| **Localization** (locale modeling, propagation, TMS/Phrase) | localization | Translations years behind (OSS projects); TMS hook (an enterprise team) | P2 |
| **Agent-friendly docs: llms.txt + SDK/API accuracy** | agent-friendly-docs | Agents are now primary consumers (multiple customers); forward-looking | P2 |
| **Reporting & ROI** | prove-value | Value-proof gates expansion & champion's role (multiple customers; one cited ~40% of doc PRs) | P2 |
| **Content audit (surface stale/inconsistent existing pages)** | remediate-legacy-content, overhaul-ia | Long-tail staleness no one can audit by hand (one enterprise's ~4k pages; another's debt-as-noise) | P2 |
| **Remediate existing pages at scale** (update/consolidate, distinct from gap backfill) | remediate-legacy-content | Brownfield corpora full of stale/duplicate pages (multiple customers) | P2 |
| **Standards & template enforcement across legacy content** | remediate-legacy-content | Off-style/off-template legacy; unify divergent processes (multiple customers) | P2 |
| **Restructure / IA-overhaul guidance** (content map, target IA, move/merge, redirects) | overhaul-ia | Capability-based IA rebuilds & refactor backlogs (one customer's "v3.0", another's refactor) | P2 |
| **Pilot success rubric** (exit metrics) | evaluate-pilot | Enterprises want a crisp definition of pilot success | P2 |
| **OSS read-only install path** (vs commercial install) | oss-onboarding | Public-repo read-only flow under-documented | P2 |

## 3. Current pages that map to no CUJ (review)

| Page | Disposition |
|---|---|
| getting-started/promptless-1-0 | Version/launch note — likely **move to Changelog** or fold into "How Promptless works"; not a journey page. |
| getting-started/core-concepts **and** core-concepts/* **and** how-to-use-promptless.mdx (+ section landing pages) | **Duplication**: concepts appear under both `getting-started/` and `core-concepts/`. Consolidate into one "How Promptless works" home. |
| integrations.mdx / how-to-use-promptless.mdx / configuring-promptless landing pages | Section landing pages — keep as section indexes in the new structure, but re-home. |

## 4. Notes

- The proposed IA is intentionally more **journey-shaped** than the current
  concept/configure/how-to split. The biggest single change is promoting **calibration** and
  the **review queue** to top-level — the two areas the corpus shows decide retention.
- Nothing here changes nav code or content. Implementing it would mean creating the `[NEW]`
  pages, consolidating the concepts duplication, and updating
  [site-navigation.ts](../../../src/lib/site-navigation.ts) + the generated sidebar — a separate
  effort.

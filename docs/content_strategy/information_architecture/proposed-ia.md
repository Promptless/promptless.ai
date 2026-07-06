---
id: proposed-ia
type: information-architecture
scope: Proposed Docs-tab IA (content under src/content/docs/docs/), designed CUJ-first
covers_nav_tab: docs
excludes: [website, pricing, blog, changelog, free_tools, jobs]
derived_from: docs/content_strategy/journeys/
companion: ia-gap-analysis.md
---

# Proposed Information Architecture — Docs tab

**Scope:** A proposed structure for the **Docs tab only** (content under
`src/content/docs/docs/`, served at `/docs`). It does not touch the website, pricing, blog,
changelog, free-tools, or jobs sections of [site-navigation.ts](../../../src/lib/site-navigation.ts).

**Method — CUJ-first, not content-first.** This IA is designed from the
[critical user journeys](../journeys/_overview.md) — what the six
[personas](../personas/_overview.md) need to *accomplish* — **not** from the topics that
happen to have pages today. Where a journey needs content that doesn't exist yet, the section
appears here anyway and is flagged `[NEW]`. The mapping of these gaps to current content is in
[ia-gap-analysis.md](ia-gap-analysis.md). **Surfacing those gaps is the goal of this exercise.**

**Design principles (from the corpus):**
1. **Follow the backbone journey.** The top-level order mirrors how accounts actually move:
   start → connect → tune → work the queue → get outcomes → scale → (migrate) → secure →
   measure. Security runs in parallel for enterprise.
2. **Lead with the make-or-break steps.** Calibration (noise/timing) and the review queue —
   where pilots are won or lost — get first-class sections instead of being buried in
   "configuring" and "how-to."
3. **Outcome sections, not feature sections.** "Keep screenshots current," "Generate release
   notes," "Pay down docs debt" are jobs users came for; reference detail sits behind them.
4. **Forwardable security.** Security/deployment is its own standalone tree because non-docs
   reviewers read it.

## Proposed structure

```
/docs
├── Start here                              ← cuj-evaluate-pilot, cuj-oss-onboarding
│   ├── Welcome
│   ├── How Promptless works (concepts: triggers, context, doc locations)
│   ├── Run a pilot (scope + success criteria)        [NEW: success rubric]
│   ├── Quickstart
│   └── Open-source quickstart (free program)
│
├── Connect your stack                      ← cuj-connect-sources
│   ├── Source control & access scope (GitHub, GitHub Enterprise, Bitbucket)  [NEW: access-scope]
│   ├── Triggers (PRs, commits, issues, Slack, Teams, Intercom, API)
│   ├── Context sources (Jira, Linear, Notion, Confluence)
│   ├── Doc locations & collections
│   └── Connection health & troubleshooting           [NEW]
│
├── Tune what Promptless suggests           ← cuj-calibrate-suggestions
│   ├── Noise & relevance filtering                   [NEW]
│   ├── Release timing & feature flags (incl. LaunchDarkly)  [NEW: general model]
│   ├── Notifications
│   └── Teaching conventions with feedback
│
├── Work the queue                          ← cuj-triage-review-queue
│   ├── The web interface / inbox
│   ├── Reviewing & editing Promptless PRs
│   ├── Assignment & routing (auto-assign)            [NEW]
│   └── Reviewing from Slack / Teams
│
├── Get the most out of Promptless          ← outcome jobs
│   ├── Keep screenshots current (Promptless Capture) ← cuj-screenshots  [NEW: auth/env/annotation depth]
│   ├── Pay down docs debt (Deep Analysis)            ← cuj-backfill-debt
│   ├── Generate release notes & changelogs           ← cuj-release-notes [NEW]
│   ├── Keep translations current (localization)      ← cuj-localization [NEW]
│   └── Build an agent knowledge base
│
├── Scale across teams                      ← cuj-multi-repo-routing
│   ├── Multi-repo routing                            [NEW]
│   ├── Versioned docs                                [NEW]
│   └── Managing environment variables
│
├── Audit & keep your docs healthy          ← cuj-remediate-legacy-content, cuj-overhaul-ia  [NEW section]
│   ├── Audit existing content for staleness          [NEW]
│   ├── Validate code samples & API contracts (Doc Detective)
│   ├── Remediate & restandardize legacy pages        [NEW]
│   └── Restructure your information architecture     [NEW]
│
├── Migrate to docs-as-code                 ← cuj-migrate-to-docs-as-code  [NEW section]
│   ├── Why docs-as-code (the prerequisite)
│   ├── Choosing a platform (Mintlify, Starlight, VitePress)
│   ├── From Doc360 / ReadMe / Fern / HubSpot / RoboHelp
│   └── Preserving URLs & redirects
│
├── Security & deployment                   ← cuj-enterprise-security-review
│   ├── Compliance & certifications
│   ├── Data handling & classification
│   ├── Network architecture
│   ├── Subprocessors & privacy
│   ├── Single sign-on (SSO)
│   ├── Self-hosting (Kubernetes / Helm)
│   └── Access & permissions (read-only posture)      [NEW]
│
├── Measure impact                          ← cuj-prove-value  [NEW section]
│   └── Reporting & ROI
│
└── Reference & help
    ├── Integrations reference (per-integration detail)
    ├── FAQ
    ├── Account management
    └── Getting help
```

## CUJ → section coverage

Every CUJ has a home; no journey is orphaned.

| CUJ | Primary section |
|-----|-----------------|
| cuj-evaluate-pilot | Start here |
| cuj-oss-onboarding | Start here → Open-source quickstart |
| cuj-connect-sources | Connect your stack |
| cuj-calibrate-suggestions | Tune what Promptless suggests |
| cuj-triage-review-queue | Work the queue |
| cuj-screenshots | Get the most out of → screenshots |
| cuj-backfill-debt | Get the most out of → Deep Analysis |
| cuj-release-notes | Get the most out of → release notes |
| cuj-agent-friendly-docs | Audit & keep your docs healthy → Doc Detective (code-sample validation only; agent-discoverability deferred — see note) |
| cuj-localization | Get the most out of → localization |
| cuj-multi-repo-routing | Scale across teams |
| cuj-remediate-legacy-content | Audit & keep your docs healthy |
| cuj-overhaul-ia | Audit & keep your docs healthy |
| cuj-migrate-to-docs-as-code | Migrate to docs-as-code |
| cuj-enterprise-security-review | Security & deployment |
| cuj-prove-value | Measure impact |

## What changes vs. today (summary)

- **Promotes** calibration and the review queue from buried sub-pages to top-level sections
  (they decide pilot success).
- **Reframes** "How to use Promptless" as outcome-oriented jobs ("Get the most out of…").
- **Adds** journey-driven areas that don't exist today: Migrate to docs-as-code, Measure
  impact, **Audit & keep your docs healthy** (audit, code-sample validation via Doc Detective,
  remediate/restandardize, restructure IA), and (as pages) noise/timing tuning,
  assignment/routing, multi-repo & versioned routing, localization, and connection-health
  troubleshooting.
- **Keeps** the strong Security & deployment tree largely intact (best-covered journey).

> **Deferred: "Make your docs agent-ready."** An earlier draft proposed a standalone
> agent-readiness area (agent-friendliness score, `llms.txt`, an MCP server for docs, serving
> Markdown to agents, maintaining agent instructions). We are **not** carving that out yet — it
> waits until the Starport feature ships. For now, the one piece that has a shipping capability
> today, **Doc Detective code-sample/API-contract validation, lives under "Audit & keep your docs
> healthy."** The rest of the agent-ready material is intentionally out of scope for this IA.

See [ia-gap-analysis.md](ia-gap-analysis.md) for the page-level current→proposed mapping and the
full gap list.

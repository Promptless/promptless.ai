# Information Architecture Report — Audit 2026-05-18

**Phase 2 (Expanded).** Sidebar shape, naming consistency, cross-linking, findability, information scent, decision-support entry points, and IA-pattern comparison (diagnostic only).

Source: [`src/lib/generated/sidebar.json`](../../../src/lib/generated/sidebar.json) → 49 sidebar leaves across 7 top-level groups + 3 nested sub-groups. Max depth 2.

## Sidebar shape metrics

| Top-level group | Leaves | Sub-groups | Max depth |
|---|---|---|---|
| Getting Started | 6 | 0 | 0 |
| Configuring Promptless | 16 | 3 | 1 |
| How to use Promptless | 8 | 0 | 0 |
| Integrations | 10 | 0 | 0 |
| Account Management | **1** | 0 | 0 |
| Security and Privacy | 7 | 0 | 0 |
| Frequently Asked Questions | **1** | 0 | 0 |
| **Total** | **49** | **3** | **2** |

**Observations:**
- Branching factor is moderate; widest section is Configuring Promptless (16 leaves), within plan threshold (>10 is flagged).
- Two **singleton groups** ("Account Management" with 1 leaf, "Frequently Asked Questions" with 1 leaf) — these don't deserve top-level slots and weaken the IA's signal-to-noise.
- 10 orphan pages (in tree, NOT in nav) per F-0003 — most are intentionally hidden, but 2 (`agent-knowledge-base`, `notion` context-source) are real content unreachable from nav.

## Naming consistency

- **Beta suffix in labels:** "Microsoft Teams Messages (Beta)", "Intercom Tickets (Beta)", "LaunchDarkly Integration (Beta)", "Microsoft Teams Integration (Beta)", "Intercom Integration (Beta)" — 5 leaves use parenthetical "(Beta)" in their visible label. Consistent with itself, but inconsistent with the trigger pages NOT marked "(Beta)" (e.g., GitHub PRs uses no status badge despite varying maturity).
- **Section-landing-as-leaf:** Three sub-groups have a leaf that re-uses the group's name (Triggers > "Triggers", Context Sources > "Context Sources"). One section reuses the entire section landing as a leaf: How to use Promptless > "How to use Promptless" (an 84-word stub page). This double-labeling is confusing.
- **Casing drift:** All four hidden core-concepts stubs are listed in sidebar (where applicable elsewhere) but `docs/core-concepts/triggers` has a *lowercase* "triggers" title in its frontmatter — inconsistent with the rest of the docs.
- **Mixed grammatical forms:** "Welcome", "Setup & Quickstart", "Introducing Promptless 1.0", "Getting Support" mix noun phrases, imperative+noun, and gerund+noun. Not a hard problem, but signals lack of a label-grammar convention.

## Slug ↔ sidebar.order coherence

Sidebar order respects the slug hierarchy. No conflicts detected. The `sidebar.order` field is hand-curated per frontmatter (not auto-derived from slug); manual coordination has held up so far.

## Cross-linking density

From Phase 1 AST analysis: 109 internal links + 59 external links across the 59 pages.

**Hub pages (≥3 inbound):**
- `docs/integrations/github-integration` (6 inbound)
- `docs/integrations/slack-integration` (5)
- `docs/configuring-promptless/triggers/git-hub-commits` (3)
- `docs/integrations/atlassian-integration` (3)

**Pages with zero inbound docs links (visible, not hidden):** 21 pages, including foundational entries like `welcome`, `setup-quickstart`, all of `getting-started/*`, and several how-tos. Per F-0017.

**No hub-landing treatment:** the integration hubs (GitHub, Slack) function as hubs by accident, not by design. There's no "Pick your integration" landing page that consolidates the 10 integration pages.

## Information scent

Audit of titles + descriptions + inbound link text against "does this signal what the user gets before they click?":

| Title | Scent assessment |
|---|---|
| "Welcome" | Weak — generic; could mean anything |
| "Introducing Promptless 1.0" | Weak — version-announcement framing; doesn't tell a user what they'll learn |
| "Setup & Quickstart" | Strong — direct, action-oriented |
| "Core Concepts" | Strong as a label, but the page underneath is a stub (W1-04) |
| "How to use Promptless" | Medium — section landing label re-used as page; describes structure not user task |
| "Working with Slack" | Strong |
| "Deep Analysis" | Weak — vague; users won't know what's behind this without clicking |
| "Customizing Notifications" | Strong |
| "Doc Detective Integration" | Strong |
| "Promptless Subprocessors" | Strong (industry-term audience knows what to expect) |

**Information-scent finding:** roughly 5 of the 49 visible labels are weak signals (Welcome, Promptless 1.0, Deep Analysis, and the two singleton-group containers). Not a wholesale rewrite candidate, but worth re-labeling the entry pages.

## Decision-support entry points

Per F-0012 (Phase 13), 8 axes of product choice exist with **zero** decision-support pages. From an IA perspective, the absence is more concrete:

- No `docs/decisions/` section
- No "Choosing a trigger" / "Choosing a context source" page in any group
- The Integrations landing (`integrations.mdx`) is a flat list, not a comparison
- The Triggers landing (`triggers.mdx`) is also a flat list
- Hosted-vs-self-hosted: `self-hosting.mdx` and `self-hosting/kubernetes-helm.mdx` are hidden, so prospects can't compare

**Implication:** the IA encourages browsing the catalog and picking the first plausible option, not informed choice. For a product with 7 triggers × 4 context sources × 10 integrations, this is friction.

## Findability simulation — 5 user tasks

Caveat: single-auditor tree-test simulation is a smoke test, not a real tree test. Findings capped at Medium confidence.

| Task | Expected path | Actual path | Friction notes |
|---|---|---|---|
| "How do I connect Slack?" | Integrations > Slack | Two valid paths: (a) Configuring Promptless > Triggers > Slack Messages, (b) Integrations > Slack Integration | Ambiguous — which is the right starting point? Slack is both a trigger and an integration. |
| "What does Promptless do with my code?" | Security and Privacy > Data Handling | Direct: Security > Data Handling and Classification (2 clicks) | Clean |
| "How do I self-host?" | Self-Hosting | **Not in nav** (hidden orphan) | Failure — only reachable via direct URL or search |
| "What's the difference between a context source and a trigger?" | Core Concepts | Core Concepts is a stub (W1-04) | Failure — no comparison page exists |
| "How do I migrate from version X to Y?" | Release notes / migration guide | **Not in nav, no page exists** | Failure — F-0013 |

**3 of 5 tasks fail at the IA level.** All three failures are already escalated as findings elsewhere (W1-05 hidden self-hosting, W1-04 stub core-concepts, F-0013 missing maintain lifecycle); this is corroboration from the findability angle.

## IA-pattern comparison (diagnostic only)

Per the plan decision #11: diagnostic only by default; no migration recommendation without explicit opt-in.

Current pattern: **hierarchical-by-feature** (Configuring Promptless / Integrations / Security and Privacy / How to use). Mapping against alternatives:

| Pattern | Fit for Promptless | Friction notes |
|---|---|---|
| **Hierarchical-by-feature (current)** | Decent for browsing | Hides the difference between triggers (configuration) and integrations (connect-and-trust); two categories that overlap for some products (Slack, GitHub) and not others |
| **Diataxis-quadrant** (4 top-levels: tutorials / how-to / reference / explanation) | Strong for matching user intent | Would split each integration's content across multiple top-levels; integration-specific pages would lose locality |
| **Task-based** ("Connect Slack", "Configure GitHub trigger", "Set up self-hosting" as top-level destinations) | Strong for new-user journey | Weakens reference lookup; integration page count would balloon (~30+ task pages) |
| **Persona-based** (one branch per persona: Tech Writer / Engineer / Security / Ops) | Strong for differentiated audiences (P3 Support / P5 Ops have <2 pages today) | Expensive to maintain; risk of duplication (every persona needs install + auth + troubleshooting) |
| **Journey-based** (Discover / Evaluate / Install / Configure / Troubleshoot / Scale / Maintain) | Excellent for first-time users | Returning users browsing for reference would have to know the journey stage of the page they want |
| **Hybrid** (Diataxis at top, feature-grouping inside reference) | Pragmatic, common in mature docs | Hardest to maintain consistency |

**Diagnostic conclusion:** the current hierarchical-by-feature is serviceable but explains the Phase 13 findings (W13-02 decision support absent, W13-04 troubleshooting inverted, F-0011 first-success orchestration missing) — those are all friction modes that hierarchical-by-feature does not natively resolve. A future migration toward hybrid (Diataxis-top + feature-grouping inside reference) would address several at once. **No migration recommended in this round.**

## Patterns (the only thing that should bubble to findings.md)

1. **Two singleton top-level groups** (Account Management, Frequently Asked Questions) — fold into existing groups.
2. **Section-landing-as-leaf double-labeling** in three sub-groups + How-to-use-Promptless — restructure landings.
3. **Weak information scent on 5 of 49 visible labels** — re-label entry pages (Welcome, Promptless 1.0, Deep Analysis).
4. **No decision-support pages exist** (corroborates F-0012).
5. **3 of 5 user tasks fail at the IA level** (corroborates W1-05, W1-04, F-0013).
6. **Beta-status convention is inconsistent** — 5 labels use "(Beta)" parenthetical, but the slug-suffix `-beta` is used in 3 slugs (intercom-tickets-beta, intercom-integration-beta, launchdarkly-integration-beta) and not in others (microsoft-teams-messages, microsoft-teams-integration use "(Beta)" label but no slug suffix). Pick one convention.

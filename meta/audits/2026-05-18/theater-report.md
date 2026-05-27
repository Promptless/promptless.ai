# Theater + AI-tells + Ownership & Freshness Report — Audit 2026-05-18

**Phase 10 (Expanded; run in the second expansion pass).** Risk indicators, not verdicts.

The framing rule is non-negotiable: language like *"shows N AI-style indicators"* or *"low ownership signal"* — **never** *"this page was AI-generated"* or *"this page is theater"*. Every finding includes false-positive notes.

Raw evidence:
- Per-page AI-tells reports: [`evidence/raw/ai-tells/api-triggers.md`](evidence/raw/ai-tells/api-triggers.md), [`evidence/raw/ai-tells/data-handling-and-classification.md`](evidence/raw/ai-tells/data-handling-and-classification.md), [`evidence/raw/ai-tells/single-sign-on-sso-setup.md`](evidence/raw/ai-tells/single-sign-on-sso-setup.md) — produced via the `identify-ai-tells` skill.
- Aggregate heuristic scan across all 55 prose-heavy pages: [`evidence/raw/ai-tells/_aggregate.json`](evidence/raw/ai-tells/_aggregate.json).
- Ownership facts: [`evidence/raw/ownership.json`](evidence/raw/ownership.json) (git-derived).

## Ownership facts (mechanical, not judgment)

| Metric | Value |
|---|---|
| Total pages | 59 |
| Single-committer pages | 27 (46%) |
| Pages with ≤2 commits total | 36 (61%) |
| Pages that are BOTH single-committer AND low-edit | 23 (39%) |
| Pages last touched >180 days | 0 |
| Max age (days since last commit) | 82 |

### Author distribution

| Last author | Pages |
|---|---|
| `promptless[bot]` | 36 (61%) |
| Prithvi Ramakrishnan | 22 |
| InlinePizza | 1 |

**Interpretation note (mandatory false-positive caveat):** `promptless[bot]` being the *last author* on 61% of pages means a Promptless-authored PR was the most recent change. It does **not** mean a human did not review and merge the PR. GitHub PR reviewer history (not visible from `git log` directly) is the actual review-and-accountability signal. This is the product dogfooding itself, which is a positive product signal even though it appears as a concentration risk in the ownership data.

## Freshness — proposed cadence and current state

Proposed cadence by page risk class (decision #8 — *proposed, not adopted*):

| Risk class | Pages | Proposed cadence | Currently overdue |
|---|---|---|---|
| High (setup, auth, security, API ref, payment, self-hosting) | 10 | every 60 days | **3** |
| Medium (how-to, integrations, configuration) | 30 | every 120 days | 0 |
| Low (concept, FAQ, glossary) | 19 | every 180–365 days | 0 |

**Pages overdue per proposed High-risk cadence (3):**
1. `docs/security-and-privacy/privacy-policy` — 82 days (cadence 60)
2. `docs/security-and-privacy/single-sign-on-sso-setup` — 82 days (cadence 60)
3. `docs/self-hosting` — 82 days (cadence 60); also hidden

**False-positive caveat:** the cadence numbers are *proposed*, not adopted policy. "82 days" is also exactly the max repo age — these pages may simply not have changed because there hasn't been a reason to. Real evidence of staleness would come from comparing them to product changes, which requires Phase 9 drift detection or product-side knowledge.

## AI-tells aggregate (55 pages scanned; 4 pages too short)

Distribution of heuristic-tell aggregate score per page:

| Score range | Pages | Reading |
|---|---|---|
| ≥4 (high signal) | 3 | Worth human review |
| =3 (moderate) | 3 | Cluster of indicators but each defensible |
| <3 (low/none) | 49 | Clean or only conventional patterns |

**No page contains a closing-pattern marker** (`In conclusion`, `Ultimately`, `In essence`, etc.). 9 pages have em-dash density >2 per 300 words, and 9 pages have >5 bold-header colon-bullets — those are structural signals, not closing-pattern issues.

### Top-signal pages (per heuristic; with `identify-ai-tells` skill output for the top 3)

| Page | Aggregate score | Top indicators | Skill verdict |
|---|---|---|---|
| `docs/security-and-privacy/data-handling-and-classification` | 5 | vocab cluster (robust, comprehensive, multi-layered, "ensuring that"), bold-bullets (4), trailing boilerplate paragraph | **moderate** (6 tells / 5 categories) |
| `docs/how-to-use-promptless/deep-analysis` | 4 | em-dash density 5.22 per 300 words | not skill-scanned individually |
| `docs/security-and-privacy/single-sign-on-sso-setup` | 4 | vocab cluster (leverage, seamless, comprehensive), 11 bold-bullets, non-conventional `<section class="pl-site-step">` HTML | **moderate** (6 tells / 4 categories) |
| `docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code` | 3 | em-dash density 2.12, "seamlessly", bold-bullets (3) | not skill-scanned |
| `docs/integrations/github-enterprise-integration` | 3 | "navigate" vocab, 9 bold-bullets | not skill-scanned |
| `docs/self-hosting` (hidden) | 3 | "comprehensive", **31 bold-bullets** (highest in set) | not skill-scanned |

### Ownership × AI-tells × Freshness overlap

The pages flagged in multiple lenses at once are the cleanest candidates for human review:

| Page | Single-committer? | Overdue? | AI-tell signal | Notes |
|---|---|---|---|---|
| `single-sign-on-sso-setup` | ✓ | ✓ (82d > 60) | High (4) | High-risk content with three risk axes overlapping |
| `data-handling-and-classification` | ✗ (≥2 committers) | ✗ (within cadence) | High (5) | AI-tells only — no ownership/freshness overlap |
| `self-hosting` | ✓ | ✓ (82d > 60) | Moderate (3) | Also hidden in sidebar; W1-05 |
| `privacy-policy` | (low edit) | ✓ (82d > 60) | Low | Freshness-only signal |

**SSO setup is the single highest-conviction "review candidate"** under the calibration regime: three independent signals point to it, and it's High-risk class. Not a verdict of "this is theater" — a recommendation to refresh it deliberately.

## Patterns (the only thing that should bubble to `findings.md`)

Per the plan: per-page entries live here; only patterns/summaries bubble to `findings.md`.

1. **Ownership concentration is real but the surface signal is misleading.** 61% of pages have `promptless[bot]` as last author. This is product dogfooding, not abandonment — but it does mean the docs ownership model needs to clarify what the *human owner* is for each page, separate from "who opened the most recent PR".
2. **Three High-risk security pages are overdue against the proposed cadence.** All exactly 82d (max-age == repo-age) — meaning they were authored at the docs set's inception and not touched since. Worth a structured refresh, especially for SSO setup which also has the highest AI-tell signal.
3. **AI-style indicators cluster in 3 pages out of 55** (~5%). One pattern: trailing boilerplate paragraphs that restate the doc's premise without new content (data-handling-and-classification line 78). Another: heavy use of `**bold-header**: explanation` bullets (self-hosting has 31; sso-setup has 11). Neither is a verdict; both are candidates for prose-tightening.
4. **No "in conclusion" / "to summarize" closings anywhere.** Whatever process produced these docs, the obvious LLM closing markers were filtered out — only the subtler structural and vocabulary tells remain.

## Proposed ownership model (deliverable, not finding)

This goes into `tooling-spec.md` as a recommendation:

- **Owner** (human, GitHub handle) declared in frontmatter on every page. Falls back to the docs-platform engineering lead if unspecified.
- **Review trigger:** PR that touches the corresponding code path, OR support-ticket-cluster on a related topic, OR scheduled cadence (per risk class), whichever comes first.
- **Last-reviewed timestamp** in frontmatter, updated when the owner re-reads the page (not when `promptless[bot]` opens an automated PR). Distinguishes "machine-touched" from "human-validated."
- **Release-flow hook:** docs changes ride alongside code changes in the same PR, OR a separate docs PR is opened by `promptless[bot]` referencing the code PR and gets reviewed by the declared owner.

## Proposed freshness cadence (deliverable, not policy)

| Risk class | Cadence | Trigger events that reset the clock |
|---|---|---|
| High | 60 days | Code change in related path; security-policy update; pen-test result |
| Medium | 120 days | Feature change; integration version bump; PostHog event-rename |
| Low | 180–365 days | Strategy shift; product-narrative change |

Both proposals require user confirmation before becoming policy.

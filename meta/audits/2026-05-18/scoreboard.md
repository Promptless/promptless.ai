# Audit Scoreboard — 2026-05-18 (final after expansion run)

Status per lens. Counts after both amendment passes (Node install + gh/Vale/Seven Action Model expansion).

| # | Lens | Status | Crit | Sig | Mod | Low | Auto % | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Inventory + ROT | complete | 0 | 2 | 3 | 0 | ~90% | Core; AST-validated. F-0005 withdrawn. |
| 2 | Information architecture + IA-pattern comparison | complete | 0 | 0 | 1 | 1 | ~80% | Expanded; full run in expansion pass. See [`ia-report.md`](ia-report.md). |
| 3 | Technical health | complete | 1 | 0 | 0 | 2 | ~85% | Build + smoke + link checking all green. **F-0006 (procedural accuracy) moved to Phase 13** in the synthesis-pass refactor. |
| 4 | Style & language | complete | 0 | 0 | 1 | 1 | ~95% | Expanded; Vale + cspell + markdownlint + alex all ran. F-0035 + F-0036. |
| 5 | Accessibility (WCAG) | complete | 0 | 1 | 0 | 0 | ~95% | Expanded; pa11y-ci full sweep across 51 docs URLs. F-0030 confirmed site-wide (153 of 154 issues are footer-contrast). |
| 6 | Agent accessibility | complete | 0 | 0 | 1 | 0 | ~90% | Expanded; AFDocs full scorecard (overall=100). F-0031/0032 withdrawn (out of scope). F-0037 (JSON-LD) added. |
| 7 | Docs usage metrics & instrumentation | complete | 0 | 1 | 3 | 0 | ~60% | Core; instrumentation-code audit only (no dashboard access). |
| 8 | ~~Procedural testing scope~~ | folded | — | — | — | — | — | **Folded into Phase 13** (procedural-accuracy sub-lens). F-0006 is now a Phase 13 finding; the headline question is procedural accuracy (pass/fail of documented procedures), not test-file count. |
| 9 | Drift / Gap + named checklists | complete | 1 | 2 | 3 | 0 | ~40% | Core |
| 10 | Theater + AI-tells + ownership & freshness | complete | 0 | 0 | 3 | 0 | ~70% | Expanded; full run in expansion pass with `identify-ai-tells` skill on top-3 + heuristic over 55. F-0038/0039/0040. |
| 11 | Multi-framework content-type fit | complete | 0 | 0 | 0 | 0 | ~85% | Expanded; classification across Good Docs + Diataxis + Seven Action Model. No new findings (corroborates Phase 13 patterns); see [`evidence/classification.csv`](evidence/classification.csv) + [evidence/amendments-expansion.md](evidence/amendments-expansion.md#phase-11-framework-classification-observation-no-new-finding-reinforces-existing). |
| 12 | Audience fit | preliminary | 0 | 0 | 0 | 0 | ~50% | Expanded; **strategy-level only** (persona-validation gate not opened). Six personas derived; matrix in [`audience-fit-report.md`](audience-fit-report.md). Findings corroborate existing; no new IDs assigned. |
| 13 | Journey & task success **(absorbs former Phase 8)** | complete | 0 | 5 | 4 | 0 | ~40% | Inferred-signal grounding (no live dashboard). **Three sub-lenses:** (1) inferred journey assessment — *complete this run*; (2) procedural accuracy via Doc Detective — *discovery-only this run*: 17 procedures found, 0 tested (inline or spec); F-0006 lives here; (3) DARI agent-simulation — *spec-only this run*, deferred per tooling-spec S14. |
| **Totals** | | | **2** | **11** | **19** | **5** | **~75%** | **37 active findings; 3 withdrawn (F-0005, F-0031, F-0032)** |

## Canonical per-page lookup

Reviewers asking *"what do we know about page X?"* should start at **[`evidence/page-data.csv`](evidence/page-data.csv)** — one row per published page joining every lens's per-page data into ~45 columns. The JSON sidecar **[`evidence/page-data.json`](evidence/page-data.json)** carries the same data with nested fields (AI-tell categories, a11y rule counts, ownership facts, finding-ID backlinks). Produced via [`evidence/build-page-data.mjs`](evidence/build-page-data.mjs); idempotent.

## Execution-profile note (next-cycle change)

This audit ran under the legacy Core/Expanded model (three passes: degraded → Node → gh+Vale). The framework's Execution Profile has been updated for future audits: **run every lens whose capability probe passes**; skip only for infeasibility or explicit opt-out. The 13 lenses always all run; per-lens calibration gates (Phase 12 persona validation, Phase 10 risk-indicator framing, Phase 11 Seven Action axis, Phase 13 DARI sub-lens) shape what each lens emits but do not change the run/skip decision.

## Headline observations (final)

- **2 Critical findings persist:** F-0001 (truncated helm command) and F-0002 (per-call model-transfer specifics vague — AI-product deal-breaker).
- **11 Significant findings:** dominated by Phase 9 drift/named-checklists (F-0009 env-vars-ref, F-0010 release-trigger) and Phase 13 lifecycle gaps (F-0011 first-success, F-0012 decision-support, F-0013 maintain-lifecycle, F-0014 security-walls), plus F-0030 (footer contrast — every doc page) and F-0008 (docs essentially uninstrumented).
- **19 Moderate findings** spread across most lenses. Several corroborate each other (W10 ownership concentration + F-0038/F-0039/F-0040 cluster).
- **All 12 lenses now have a status of `complete`, `preliminary`, or `folded`** — no `not run` lens remaining. Phase 8 was folded into Phase 13 in the synthesis pass.
- **Lens count: 12** (numerically; Phase 8's slot is preserved for cross-reference continuity but its substance lives under Phase 13's procedural-accuracy sub-lens).
- **Three withdrawn findings** (F-0005, F-0031, F-0032) demonstrate the "no regex over MDX" + "out-of-scope" disciplines working — two false-positives caught, one scope-creep caught.
- **Calibration regimes held:** Phase 10 produced no "this page is theater" verdicts; Phase 12 produced no per-page persona-mismatch findings without validation; Phase 11's Seven Action axis ran only after the user supplied the canonical reference.

## Audit-infrastructure observations

- The audit ran in three passes: degraded shell-only → Node-enabled re-validation → Expansion with brew/gh/Vale. The pass structure is the most valuable methodological output; the `tooling-spec.md` S10 (containerize the audit) would collapse all three passes into one.
- All 7 originally-Expanded lenses that remain after the Phase 8 fold ran in this audit (Phase 2/4/5/6/10/11/12). Doc Detective discovery now feeds Phase 13's procedural-accuracy sub-lens; full Doc Detective execution remains excluded by user opt-out. Phase 12 stays strategy-level (persona validation not opened).

## Legend

- **Status:** `complete` (lens ran to substance) · `preliminary` (lens ran but capped by a calibration gate, e.g., Phase 12) · `partial` (lens analysis ran but a key execution piece was excluded) · `folded` (lens substance moved into another lens, e.g., Phase 8 → Phase 13) · `skipped` · `not run`.
- **Crit/Sig/Mod/Low:** active finding counts (excluding withdrawn).
- **Auto %:** share of this lens's checks that could be a CI job vs. needing human judgment.

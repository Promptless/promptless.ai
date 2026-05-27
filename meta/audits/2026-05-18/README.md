# Docs Audit — 2026-05-18

Brownfield audit of `promptless.ai/src/content/docs/`. Plan and method live at the executor's plan file ([okay-friend-fun-time-bubbly-lollipop.md](../../../../.claude/plans/okay-friend-fun-time-bubbly-lollipop.md) outside the repo). The reusable checklist + tooling spec are part of this audit's outputs.

**This audit ran in three passes** under the legacy Core/Expanded execution model; future audits run all available lenses in one pass per the updated Execution Profile.
1. **Pass 1 (degraded)** — initial Core audit with no Node.js available. Shell-only tools; 29 findings.
2. **Pass 2 (Node available)** — re-validated parsing-dependent findings; Phase 5 + 6 became partially reachable. See [evidence/amendments.md](evidence/amendments.md). Net +2 findings.
3. **Pass 3 (gh + Vale + Seven Action Model)** — full Phase 2/4/5/6/10/11/12 work. See [evidence/amendments-expansion.md](evidence/amendments-expansion.md). Net +8 new findings, −2 withdrawn (out of scope).
4. **Synthesis pass** — produced the canonical [evidence/page-data.csv](evidence/page-data.csv) + [evidence/page-data.json](evidence/page-data.json) (one row per page joining every lens) and specced DARI-docs as a Phase 13 sub-lens for the next audit cycle.

**Final count:** 37 active findings (2 Critical, 11 Significant, 19 Moderate, 5 Low); 3 withdrawn (F-0005 false-positive, F-0031/F-0032 out-of-scope). All **12 lenses** have status `complete`, `preliminary`, or `folded` per [scoreboard.md](scoreboard.md) — Phase 8 (procedural testing scope) was folded into Phase 13 (procedural-accuracy sub-lens) in the synthesis pass. Doc Detective full execution is excluded by user opt-out; discovery data is captured in F-0006 and in [page-data.csv](evidence/page-data.csv)'s `dd_*` columns.

**Per-page lookup:** start at [evidence/page-data.csv](evidence/page-data.csv) — one row per published page with ~45 columns spanning every lens that ran. The JSON sidecar [evidence/page-data.json](evidence/page-data.json) carries the same data with nested fields (AI-tells categories, a11y per-rule counts, ownership facts, finding-ID backlinks). The per-lens raw outputs in `evidence/raw/` and `evidence/*.csv` remain as evidence; `page-data.csv` is the front door.

## How to read this audit

| Tier | Purpose | Where to start |
|---|---|---|
| **Per-page lookup** | "What do we know about page X?" | [evidence/page-data.csv](evidence/page-data.csv) + [evidence/page-data.json](evidence/page-data.json) |
| 1 — Headline | Scoreboard + full findings + reusable artifacts | [scoreboard.md](scoreboard.md), [findings.md](findings.md), [checklist.md](checklist.md), [tooling-spec.md](tooling-spec.md) |
| 2 — Per-lens | Detail per audit lens that ran with substance | [inventory.md](inventory.md), [metrics-report.md](metrics-report.md), [drift-report.md](drift-report.md), [journey-report.md](journey-report.md), [ia-report.md](ia-report.md), [theater-report.md](theater-report.md), [audience-fit-report.md](audience-fit-report.md) |
| 3 — Evidence | Raw artifacts, commands, skipped checks | [evidence/](evidence/) |

## Scope this run

- **Content target:** `src/content/docs/` (59 published MDX files; `internal/component-fixtures.mdx` excluded as a verified non-doc fixture).
- **Lenses run (Core):** Inventory + ROT, Technical health, Docs usage metrics & instrumentation (instrumentation-code audit only), Drift / Gap + named checklists, Journey & task success, Synthesis.
- **Lenses deferred (Expanded):** IA, Style & language, Accessibility, Agent accessibility, Doc Detective coverage, Theater + ownership + freshness, Multi-framework content-type fit, Audience fit. Recorded in [scoreboard.md](scoreboard.md) as `not run`.

## Environment caveats (read before consuming findings)

**First-pass caveat (now resolved):** Node.js was initially unavailable; AST-based MDX parsing, lychee, Vale, markdownlint, alex, cspell, pa11y-ci, Lighthouse, and Doc Detective could not run. **Amended in the second pass** after `nvm install 24`. See [evidence/amendments.md](evidence/amendments.md). Findings originally tagged `evidence: degraded-parser` were re-validated; one (F-0005) was withdrawn as a false positive.

**Still applicable:** Live signal access (PostHog, GA, Search Console, support tickets, etc.) was not confirmed. Phase 7 ran the instrumentation-code half only; Phase 13 grounded findings against repo signals rather than live usage. Affected findings carry `evidence: inferred` and are capped at Medium confidence.

These constraints inform [tooling-spec.md](tooling-spec.md) — S10 (containerize the audit) is the single highest-leverage item to prevent the Node-availability gap from recurring.

## Finding schema

Every finding in [findings.md](findings.md) follows this structure (also embedded here so reviewers don't have to leave the audit):

```md
## F-NNNN — <short title>
- **Lens:** <one of the 12 lenses (Phase 8 folded into Phase 13)>
- **Severity:** Critical | Significant | Moderate | Low
- **Page/entity:** <file path or system entity; "(global)" if cross-cutting>
- **Evidence:** <observed signal — quote, command output, file:line, screenshot path>
- **Source command:** <if generated; reference to `evidence/raw/...` artifact>
- **Why it matters:** <user/business impact, 1–2 sentences>
- **Confidence:** High | Medium | Low (+ 1-line rationale)
- **Remediation type:** Fix | Improve | Consolidate | Remove | Create | Spec-only
- **Automation candidate:** Yes (tool: ...) | Partial | No (human judgment required)
- **False-positive notes:** <how this could be wrong; required for Low-confidence or judgment-driven findings>
```

## Reproducibility

- Tool versions used: [evidence/tool-versions.txt](evidence/tool-versions.txt)
- Every command run: [evidence/commands.log](evidence/commands.log)
- Skips and degradations: [evidence/skipped-checks.md](evidence/skipped-checks.md)
- Inventory and per-page data: [evidence/inventory.csv](evidence/inventory.csv)

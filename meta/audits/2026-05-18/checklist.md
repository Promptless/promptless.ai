# Brownfield Docs Audit Checklist (Reusable)

**Derived from the 2026-05-18 audit of `promptless.ai/src/content/docs/`.** Tested on that docs set; designed to be runnable against any brownfield docs tree with similar properties (Markdown/MDX content, frontmatter-based metadata, a built docs site).

The audit has **12 lenses** (Phase 8 was folded into Phase 13 — procedural-accuracy via Doc Detective is now a Phase 13 sub-lens alongside agent-simulation via DARI). Run every lens whose capability probe passes; skip only for infeasibility or explicit user opt-out. See the [Execution Profile](#execution-profile) below.

This checklist is the *method*. The 2026-05-18 audit's findings live in [findings.md](findings.md); this file is what you'd hand to a fresh executor on a different docs set.

---

## Execution profile

**Run every lens whose capability probe passes.** A lens is only skipped for one of two reasons, both recorded in `evidence/skipped-checks.md`:
1. **Infeasible** — a hard capability dependency is missing (no Vale, no DARI credentials, no Chrome, etc.).
2. **User opt-out** — explicit exclusion at preflight ("don't run Doc Detective full execution").

No Core/Expanded tiering — that staging produced reports that under-claimed what the audit knew. The 12 lenses (Phase 8 folded into Phase 13) always all run unless their capability check returns infeasible.

Per-lens calibration gates (these are shape constraints, not run/skip decisions):
- **Phase 12** without persona validation → strategy-level findings only (the lens still runs)
- **Phase 11** without a Seven Action Model reference → Good Docs + Diataxis axes only (Seven Action axis skip-recorded)
- **Phase 10** every finding requires false-positive notes; risk indicators not verdicts
- **Phase 13 DARI sub-lens** runs only if `dari-docs` CLI + dari.dev credentials available; the lens itself still runs with inferred grounding

Stop condition: every lens reaches `complete | preliminary | skipped(infeasible) | skipped(opt-out)`; Tier 1 artifacts complete; `evidence/page-data.csv` produced; checklist contains enough method detail that a fresh executor could re-run on a different docs set.

**Lens count is frozen at 13.** Don't add a Phase 15 — fold reviewer requests into the closest existing lens.

---

## Preflight — environment & contract

- [ ] **Record `git rev-parse HEAD`, branch, dirty state** to `evidence/commands.log`. Dirty trees are not blocking; snapshot diff to `evidence/preflight-diff.patch` and tag affected findings `evidence: pre-commit`.
- [ ] **Probe every tool** in the capability matrix. Record versions in `tool-versions.txt`. Record substitutions/skips in `skipped-checks.md`. **No silent substitution.**
- [ ] **Confirm Node.js is available.** If absent: parser-dependent phases degrade to shell-based pattern matching; document the degradation. Most lenses can still produce value, but tag findings `evidence: degraded-parser`.
- [ ] **GitHub auth check** (`gh auth status`) — needed for AFDocs scheduled-run access (Phase 6).
- [ ] **Analytics dashboard access** — ask user: PostHog, GA, Search Console, support tickets, GitHub issues, Slack/Discord, sales notes? Phase 7 instrumentation-code audit always runs; live-data audit depends on this.
- [ ] **Confirm decisions** before starting: frontmatter expansion (default: flag-only), tool install policy (default: npx + pinned), persona source for Phase 12 (default: produce-and-validate before scoring), Seven Agent Doc Model reference (default: skip Phase 11 agent axis if no canonical ref).
- [ ] **Real-user-signal privacy**: never copy verbatim user content; anonymize sources; tag `signal-source: cited-only` if anonymization not feasible.

**Exit gate:** `tool-versions.txt`, `skipped-checks.md`, `commands.log` exist before Phase 1 begins.

---

## Phase 0 — Scaffold

- [ ] Create `meta/audits/YYYY-MM-DD/` and `evidence/` subtree.
- [ ] Seed Tier 1 stubs: `README.md`, `scoreboard.md`, `findings.md`, `tooling-gap-analysis.md`, `checklist.md`, `tooling-spec.md`.
- [ ] Seed Tier 2 stubs only for Core-required reports: `inventory.md`, `metrics-report.md`, `drift-report.md`, `journey-report.md`. Other Tier 2 reports created on demand.

---

## Phase 1 — Inventory + ROT (Core)

**Goal:** machine-readable per-page metrics + cross-check against nav.

- [ ] **Parser strategy:** If node available, use `gray-matter` + `remark-mdx` AST. If degraded: bounded-YAML frontmatter parser in stdlib; targeted regex for known shapes (`<Frame>`, `<Image>`, `![]()`); no general regex over MDX body.
- [ ] **Required columns:** `path, slug, title, description_present, sidebar_order, sidebar_hidden, word_count, h1_count, h2_count, code_block_count, image_count, image_alt_present_ratio, internal_link_count, external_link_count, inbound_link_count, last_modified (git %ci), last_author, age_days, distinct_committers_count, is_generated`.
- [ ] **Cross-check against the nav source** (`sidebar.json`, `_sidebar.json`, Hugo `menu`, etc.) for: **orphans** (in tree, not nav) and **ghosts** (in nav, no MDX). Distinguish orphans by `sidebar.hidden` status.
- [ ] **Flag:** stub pages (<100 words), oversized pages (>2000 words), pages with `image_alt_present_ratio < 1.0`, pages with no `description`, pages with zero inbound links.
- [ ] **Denominator verification:** confirm exclusion paths (e.g., `internal/`, fixtures, examples) contain only non-published content. Document the denominator.

**Output:** `evidence/inventory.csv` (machine-readable) + `inventory.md` (human-readable table) + ROT candidates added to `findings.md` working notes.

**Findings to expect on a brownfield set:** orphans/ghosts (always at least some), missing-description rate, alt-text gaps, stale page candidates.

---

## Phase 2 — Information architecture (Expanded)

- [ ] **Sidebar shape metrics:** depth, branching factor, group balance. Flag groups >10 children or >3 levels deep.
- [ ] **Naming consistency:** parallel grammar within sibling groups.
- [ ] **Slug ↔ sidebar.order coherence** detection.
- [ ] **Cross-linking density:** orphan (0 inbound) and hub (>10 inbound) lists; flag hubs lacking landing treatment.
- [ ] **Information scent:** sample-based audit of titles, descriptions, H2s, link text — do they signal what the user gets before they click?
- [ ] **Findability simulation:** 5 representative user tasks; tree-test path from landing; record clicks-to-answer and dead-ends. (Single-auditor simulation is a smoke test, not a real tree test — cap confidence at Medium.)
- [ ] **IA-pattern comparison:** map current IA against hierarchical-by-feature, Diataxis-quadrant, task-based, persona-based, journey-based, hybrid. **Diagnostic only** by default; recommendation requires explicit user opt-in.
- [ ] **Decision-support entry-point catalog:** which pages help users choose between options? List axes without entry points.

---

## Phase 3 — Technical health (Core)

- [ ] **Build / typecheck baseline.** Capture output, warnings, errors. If the build fails, it's **Critical** *only if* it blocks docs rendering or published-docs validation; otherwise Significant/Moderate tooling-health finding. Don't escalate "build broke because of unrelated app code" to Critical.
- [ ] **Link check** with lychee (live HTTP probes) OR `rg`-pattern extraction (format/presence only, degraded). External-link checks are **live-service dependent** — re-run before publishing.
- [ ] **Code-sample taxonomy:** count fenced blocks by language. Flag untagged blocks (markdownlint MD040 catches these).
- [ ] **Code-sample syntax validation:** for languages with parsers available (bash/sh via shellcheck, ts/js via tsc, json/yaml via stdlib parsers). Validate; don't fail on missing toolchain — flag for tooling-spec.
- [ ] **Code-sample example quality** (sampled, judgment): per page with code, sample up to 3 examples and assess 6 dimensions: realistic, minimal, copy-pasteable, secure (no real secrets), current, connected-to-task. Confidence: Medium max without test execution.
- [ ] **Doc Detective coverage:** count procedures (Steps components + imperative numbered lists) vs. existing specs. Compute coverage ratio.

**Findings to expect:** untagged code fences, link rot (if reachability tested), example quality variance, low procedure-test coverage.

---

## Phase 4 — Style & language (Expanded)

- [ ] **Vale** (Microsoft + Google + write-good packs at minimum). Baseline run, violation counts by rule.
- [ ] **markdownlint-cli2** with permissive default.
- [ ] **alex** for inclusive language.
- [ ] **cspell** with project-specific dictionary seeded from Phase 9's system-graph nouns (or from Phase 1 frontmatter terms if Phase 9 hasn't run).
- [ ] **International readability:** sample-based check — average sentence length, idioms, unexplained acronyms, phrasal verbs. Reuses Vale output if a readability pack is configured.

Configs live under `evidence/tools-config/` for the audit; `tooling-spec.md` proposes where they should move long-term.

---

## Phase 5 — Accessibility (WCAG) (Expanded)

- [ ] Build site locally, serve `dist/`.
- [ ] **pa11y-ci** against every doc URL, WCAG 2.1 AA.
- [ ] **Alt-text check** on MDX directly (AST-based; not regex) — flag `<Frame>` / `<Image>` / `![]()` without alt.
- [ ] **Lighthouse-CI** on a representative sample (1 per page type).
- [ ] Pin Chrome/Chromium version; record axe-core version.

---

## Phase 6 — Agent accessibility (Expanded)

- [ ] Pull latest **AFDocs** scheduled-run result. If stale (>72h) and gh auth available, trigger fresh.
- [ ] Validate `/llms.txt` and `/llms-full.txt`: every doc page present? descriptions complete? Compare live vs local regeneration for drift.
- [ ] **JSON-LD presence:** flag candidate pages where `TechArticle` / `HowTo` schemas would improve agent comprehension (recommendation, not failure).

---

## Phase 7 — Docs usage metrics & instrumentation (Core)

**Core ceiling:** instrumentation-code audit only. Don't interpret trends unless dashboard data is already exported.

- [ ] **Instrumentation inventory.** Scan components and pages for event-emit attributes (`data-track-*`, `posthog.capture`, `gtag` etc.). Produce `evidence/instrumentation.csv`: file, line count, scope (marketing/shared/docs-shell/docs-content), notes.
- [ ] **Per-page docs coverage:** which docs pages emit which events? Heatmap.
- [ ] **Event catalog audit:** compare any documented catalog (e.g., an `events.md`) against actually-emitted events. Flag catalog-only events (documented but never emit) and code-only events (emit but never documented).
- [ ] **Naming-convention check** against catalog conventions.
- [ ] **Search analytics presence:** is internal search instrumented? Zero-result queries captured?
- [ ] **Feedback widget presence** anywhere (helpful-vote, comments, report-issue link)?
- [ ] **Agent-fetch logging:** is `/llms.txt` / `/llms-full.txt` access logged or measured?
- [ ] **Dashboard access status:** record in `skipped-checks.md`. Findings without dashboard access tagged `evidence: instrumentation-only`.
- [ ] **Hard-scope reminder:** audit event *presence, naming, coverage, intent*. Do **not** audit payload correctness or implementation details — those are product engineering.

**Significant severity rule:** "no instrumentation on a high-value page when there's a stated measurement goal or known user pain". Bare "no tracking" alone is Moderate.

---

## Phase 8 — Folded into Phase 13

Doc Detective procedural-accuracy testing produces pass/fail signals that are the same kind of task-success evidence Phase 13 measures. The methodology (enumerate procedures, locate tests, run them, score) lives under Phase 13's procedural-accuracy sub-lens. See the Phase 13 section below.

Counting tests alone is not a finding; what matters is whether the documented procedures yield the documented outcomes when executed.

---

## Phase 9 — Drift / Gap + named checklists (Core)

- [ ] **System graph extraction** (read-only inspection of `src/pages/`, `src/components/`, content schemas, env vars, deploy configs). TS compiler API preferred; `ripgrep` fallback degrades mapping confidence to Medium max.
- [ ] **Doc graph** from inventory + sidebar.
- [ ] **Three drift sets,** each row carrying a mapping-confidence column (High/Medium/Low):
  - **Missing:** in system graph, not in docs.
  - **Potential drift:** in docs, *and* corresponding code changed recently. Tagged "potential" because code change ≠ documented-behavior change. **Never** bubbles to Significant without High mapping confidence.
  - **Orphaned:** in docs, no corresponding system entity.
- [ ] **Named checklists at Core depth** (category-level findings; per-surface enumeration is an Expanded depth pass):
  - **Reference completeness:** API/CLI/webhook/config shape + every field with type/required/default/limits/permissions/error responses + minimal + realistic example.
  - **Trust & safety:** data handling, what's sent to external models, retention, redaction, permissions, security boundaries, privacy, audit logging, regional notes. **Critical only for products handling customer code, private data, regulated data, or external model/provider transfer** (severity rubric caveat).
  - **Release/migration/deprecation:** versioning model, current vs prior behavior, deprecation timeline, migration paths, beta lifecycle.

---

## Phase 10 — Theater + AI-tells + ownership & freshness (Expanded)

**Risk indicators, not verdicts.** Use language like "shows N AI-style indicators" / "low ownership signal" — never "this page was AI-generated" / "this page is theater".

- [ ] Run `identify-ai-tells` skill across all pages (or fallback heuristic checklist). Output to `evidence/raw/ai-tells/<slug>.md`.
- [ ] Apply theater patterns: cargo-cult docs, AI-only content, checkbox compliance, missing accountability.
- [ ] **Ownership facts** from git log: committers per page, last touched, distinct-committer count.
- [ ] **Ownership risk indicators** (not verdicts): single-committer + low-edit pages, pages last touched >180 days, pages with no human-readable owner.
- [ ] **Proposed ownership definition** (deliverable, not finding): who updates docs when which code changes, what review is required, what events trigger review.
- [ ] **Freshness policy by page risk** (proposed): High-risk (60d), Medium (120d), Low (180–365d) cadence.
- [ ] **Every theater/AI-tells/ownership finding must include false-positive notes.** "Low edit count may indicate stable mature content, not abandonment."
- [ ] Per-page entries in `theater-report.md`; only patterns/summaries bubble to `findings.md`.

---

## Phase 11 — Multi-framework content-type fit + concept model (Expanded)

- [ ] **Per-page typing in multiple frameworks:**
  - **Good Docs Project** (always): concept / quickstart / how-to / tutorial / reference / troubleshooting / release-notes / changelog / glossary / style-guide.
  - **Diataxis** (always): tutorials / how-to guides / reference / explanation. Each page should have **one dominant mode** (not "exactly one quadrant" — too strict). Mixed *primary intent* is the finding.
  - **Seven Agent Documentation Model:** optional, runs only if a canonical reference is provided at preflight. **No silent default.** Skip and record if no reference.
- [ ] **Cross-framework matrix** in `evidence/classification.csv` (page × framework × type).
- [ ] **Framework disagreement is a review cue**, not automatically a finding. Promotes to finding only when disagreement maps to concrete risk: user confusion, maintenance burden, or task failure.
- [ ] **Pure-type compliance** per framework (only for frameworks that ran).
- [ ] **Conceptual-model quality** (docs-set-level, not page-level): core nouns explained, relationships explained, lifecycle, constraints, "how the pieces fit together". Absence of any is Significant.
- [ ] **Output:** findings + `classification.csv`. No separate `content-type-report.md`.

---

## Phase 12 — Audience fit (Expanded)

**High circularity risk — calibration regime is mandatory.**

- [ ] **Step A — provisional persona model BEFORE scoring.** Each persona: name, role, primary tasks, vocabulary level, expected starting context, source of evidence, confidence tag.
- [ ] **Step B — stakeholder validation gate.** Persona inventory reviewed by user before any per-page scoring. If user declines: produce *strategy-level findings only*.
- [ ] **Step C — distinguish failure modes:**
  - Strategy gap (docs set underserves a persona)
  - Page execution gap (specific page misaligned)
- [ ] **Persona × Good Docs page-type coverage matrix.** Empty cells = strategy gap (always valid).
- [ ] **Per-page persona assignment:** only after Step B.
- [ ] **Sample-based** vocabulary / assumption / task-orientation / voice checks with confidence + false-positive notes.

---

## Phase 13 — Journey & task success (Core)

- [ ] **8-stage journey map:** Discover → Evaluate → Install/connect → First success → Configure → Troubleshoot/recover → Scale/mature → Maintain/update. For each stage: which pages serve it, are there cliffs?
- [ ] **Task success criteria** for **major docs** (mechanically defined: quickstarts + how-tos + integrations + setup/install/auth/self-hosting + getting-started + reference). For each: "After following this, the user should be able to verify ____ by ____."
- [ ] **Onboarding gradient** plot. Look for cliffs (beginner → advanced with nothing between) and plateaus.
- [ ] **Troubleshooting & recovery matrix** per high-traffic feature.
- [ ] **Decision support** content audit. **Self-contained if Phase 2 didn't run** — enumerate plausible axes of choice from the product surface and check.
- [ ] **Real-user-signal grounding** (when available). Findings grounded in real signals get `evidence: real-signal` (may upgrade to High confidence). Findings purely from journey inspection: `evidence: inferred`, capped at Medium.
- [ ] **Trust & Safety walkthrough** (handoff from Phase 9): simulate the security-reviewer journey through trust-and-safety pages.
- [ ] **Procedural accuracy (Doc Detective sub-lens; absorbs former Phase 8).** Three discovery surfaces and an execution step:
  - **Discovery — spec files:** `ls .doc-detective/tests/*.spec.json` (or whatever path the Doc Detective config points at). Count of recorded-script tests.
  - **Discovery — inline markers:** `rg '\{\s*\*doc-detective|<!--\s*doc-detective' src/content/docs/`. Doc Detective parses MDX comments and special markers; inline tests live alongside the prose they verify and need the `detectSteps` config setting (or explicit step blocks).
  - **Discovery — procedure population:** count `<Steps>` blocks + imperative numbered lists via AST. That's the denominator for "how many procedures could be tested?"
  - **Coverage:** `(spec-tested + inline-tested) / total procedures`. Headline metric for "is procedural accuracy measurable?"
  - **Execution:** if Doc Detective credentials/env vars are present, run the tests (`doc-detective` CLI; existing `.github/workflows/doc-detective.yml` for CI integration). Capture pass/fail per test.
  - **Findings tagging:** `evidence: discovery-only` when only the coverage/population data is captured; `evidence: procedural-test` when pass/fail is captured. Test failures on Critical/Significant procedures elevate the affected finding's severity to match.
  - **What this lens is NOT:** counting test files. Counting alone is a non-finding; pass/fail rate is the task-success signal.
- [ ] **Agent task-success simulation (DARI sub-lens).** Run only if `dari-docs --version` succeeds and dari.dev credentials are present (self-managed mode is the default). Send the docs to simulated developer agents via `dari-docs check`; tasks defined in `evidence/dari/tasks.yml`. Agents attempt each task using only the docs and report where they got stuck. Findings tagged `evidence: simulated-agent`; cap at Medium confidence unless **≥2 agents stuck at the same step** (then upgrade to High). Mandatory false-positive notes — "agent stuck because docs are ambiguous" must be distinguished from "agent stuck because the task is genuinely hard." See tooling-spec **S14** for the install + task-set + CI wiring. **Do not pass `--apply`** — audit surfaces findings; the audit does not rewrite content.
- [ ] **Distinguishing the procedural-accuracy and agent-simulation sub-lenses:** Doc Detective asks *"does the procedure as written produce the expected outcome?"* (deterministic, binary pass/fail). DARI asks *"can an agent figure out the docs and complete an open-ended task?"* (probabilistic, stuck-at-step). Both feed Phase 13's finding stream and both can elevate severity; their false-positive notes differ.

---

## Phase 14 — Synthesis

- [ ] **Finalize `findings.md`** with severity-sorted sections; assign IDs `F-NNNN` (sort: severity → lens; dense; zero-padded; reassigned each run).
- [ ] **Update `scoreboard.md`** with finding counts per lens + automation candidate %.
- [ ] **Write `checklist.md`** (this file, for re-use). One section per lens, marking each item as tool-automatable / human-judgment / hybrid. Include the finding schema and the calibration regimes from Phases 10 and 12.
- [ ] **Write `tooling-spec.md`** — chosen tool + config sketch + CI integration point + exit criteria + ROI tier for every automatable check.
- [ ] **Build canonical page-level data store.** Run `evidence/build-page-data.mjs` to merge every per-lens raw output keyed at the page level (inventory, instrumentation, classification, ownership, ai-tells, vale, cspell, pa11y, AFDocs llms.txt coverage, DARI runs when present, finding-ID backlinks). Emit `evidence/page-data.csv` (~45 flat columns × N rows) + `evidence/page-data.json` (same data + nested fields). Idempotent — re-running overwrites both outputs from current evidence. The per-lens raw outputs remain as evidence; `page-data.csv` is the single front door for any "what do we know about page X?" question. Update README's "How to read this audit" so reviewers land here first.

**Stop condition:** every Critical and Significant finding has a complete schema, non-trivial confidence rationale, and a resolvable evidence reference. `page-data.csv` row count matches the published-doc denominator (`find src/content/docs -name '*.mdx' -not -path '*/internal/*' | wc -l`).

---

## Finding schema

Non-negotiable for Theater (Phase 10) and Audience fit (Phase 12) due to judgment density. Recommended for every finding.

```md
## F-NNNN — <short title>
- **Lens:** <one of the 12 lenses (Phase 8 folded into Phase 13)>
- **Severity:** Critical | Significant | Moderate | Low
- **Page/entity:** <file path or system entity; "(global)" if cross-cutting>
- **Evidence:** <observed signal — quote, command output, file:line, screenshot path>
- **Source command:** <reference to `evidence/raw/...` artifact, if generated>
- **Why it matters:** <user/business impact, 1–2 sentences>
- **Confidence:** High | Medium | Low (+ 1-line rationale)
- **Remediation type:** Fix | Improve | Consolidate | Remove | Create | Spec-only
- **Automation candidate:** Yes (tool: ...) | Partial | No (human judgment required)
- **False-positive notes:** <how this could be wrong; required for Low-confidence or judgment-driven findings>
```

## Severity rubric (decision rules)

- **Critical:** user task failure, data loss, security/privacy exposure, regulatory miss, factually wrong instruction. Trust-and-safety gap qualifies as Critical only for products handling customer code, private data, regulated data, or external model/provider transfer.
- **Significant:** blocks a common workflow with workaround available; missing topic that a primary persona needs; high-confidence drift on frequently-touched page; strategy-level audience gap; **no instrumentation on a high-value page with stated measurement goal or known pain** (bare "no tracking" is Moderate).
- **Moderate:** reduces clarity, accumulates debt; style/consistency violations; ownership/freshness signals; content-type mismatches.
- **Low:** cosmetic, single-page lint, individual typos.

When in doubt, default down. Critical requires a 1-line user-impact statement in the finding.

---

## Anti-patterns to watch for

Each was caught during this audit's review cycles; they recur in brownfield audits.

| Trap | Why it bites |
|---|---|
| Over-claiming reproducibility | Live-service-dependent checks (link reachability, AFDocs, dashboards) vary by run; tag them as such, don't pretend they're deterministic. |
| Theater/AI-tells as conclusions | "This page was AI-generated" is a verdict; "shows N AI-style indicators" is an observation. The first is reputationally loaded and likely wrong; only the second is responsible. |
| Persona infer-and-score in one pass | Inferring personas from docs and then scoring docs against the inferred personas is circular. Persona model must be produced and validated *before* per-page scoring; without validation, restrict to strategy-level findings. |
| "Generate 13 files because the plan said so" | Use the Tier discipline. Core-required reports always; Expanded reports only when their lens reaches substance (≥80% page coverage or ≥3 findings). Otherwise summary in scoreboard. |
| Framework disagreement = automatic finding | Frameworks model different things; disagreement is a review cue. Promote to finding only when disagreement maps to user confusion, maintenance burden, or task failure. |
| Silent tool substitution | Every fallback or skip goes in `evidence/skipped-checks.md` with reason. The audit's reproducibility kit is the substitution log. |
| Verbatim user content in artifacts | Real-user signals must be anonymized (category labels, counts, IDs). Sensitive substrings scrubbed at ingestion. |
| Stopping at "the file exists" | Verification: pull a random 10% of findings; every one must have schema fields populated, evidence resolvable to a file:line or `evidence/raw/...` artifact. |

---

## Checklist reproducibility test

The audit is the *method*, not the findings. To verify this checklist works on a different docs set: hand it to a fresh-context agent pointed at a second docs fixture (a sibling repo's `docs/`, or a few pages from another content collection). Confirm the agent can execute Preflight + Phase 1 (Inventory) using only this checklist — same method, different content.

Reproducing the 2026-05-18 findings on a different doc set is **not** the goal and not expected.

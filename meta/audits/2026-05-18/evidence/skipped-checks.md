# Skipped Checks — Audit 2026-05-18

Per the audit plan's "no silent substitution" rule, every fallback or skip is recorded here with its reason and the substitution (if any).

## Amendment notice

Node was installed mid-audit (see [amendments.md](amendments.md)). Most of the rows below were resolved or partially resolved in the second pass. Each row carries an **Amended status** column showing post-Node availability.

## Environment-level skips

| Capability | Status | Reason | Substitution | Tag on dependent findings | **Amended after Node install** |
|---|---|---|---|---|---|
| `node` + `npm` + `node_modules` | MISSING | No node binary, no nvm/asdf/mise/fnm/volta | Shell-based frontmatter parsing in Phase 1; `npm run check` recorded as F-0007 finding | `evidence: degraded (no node)` | **✓ Resolved.** Node 24.15.0 via nvm; `npm ci` ran (948 packages). AST inventory re-validated all parsing-dependent findings. F-0007 downgraded to Low. |
| `gh` CLI | MISSING | Not installed | Workflow file inspection only | `evidence: workflow-inspection-only` | Still missing; AFDocs run **directly via `npx afdocs`** in the amendment pass (live data). Two new Moderate findings added (F-0031, F-0032). |
| Network egress to external URLs | NOT PROBED | No active link checking | `rg`-based extraction (format only) | `evidence: not-reachability-tested` | **✓ Resolved.** Node `fetch` over 28 unique URLs → 27 OK, 1 anti-bot 403 on Clerk page (false positive). F-0029 evidence confirmed at Low severity. |
| Vale / markdownlint / alex / cspell | SKIPPED | All require node | Phase 4 Expanded — not selected | n/a (lens not run) | markdownlint + alex **ran in amendment pass** even though Phase 4 wasn't selected — they validated F-0018 (MD040 = 8 errors, matches AST) and confirmed no inclusive-language issues (alex clean). |
| pa11y-ci + Lighthouse | SKIPPED | Require node + built `dist/` | Phase 5 Expanded — not selected | n/a (lens not run) | pa11y **ran in amendment pass** on `welcome` against local `dist/` — caught 3 WCAG 1.4.3 contrast failures on footer H3s (renders on every page). Added as F-0030 Significant. |
| `shellcheck` | MISSING | Not installed | Presence + obvious-issue review | `confidence: Medium` max | Installed via `npm shellcheck` wrapper in amendment pass. **Did not detect F-0001 truncation** — `bash -n` accepts trailing-`\` at EOF as syntactically valid. Custom MD-lint rule still required (tooling-spec S5). |
| `tsc` API for system-graph extraction | MISSING | No node | `ripgrep` patterns for routes + env vars | Mapping confidence Medium max | Now available; not re-run in amendment pass because Phase 9 findings stood up on inspection. |
| MDX AST parser (`gray-matter` + `remark-mdx`) | DEGRADED | No node | Bounded-YAML frontmatter; targeted `rg` for `<Frame`/`<Image`/`![]()`. | `evidence: degraded-parser` | **✓ Resolved.** Full AST inventory ran (`build-inventory-ast.mjs`). Withdrew F-0005 (false-positive alt-text gap); downgraded F-0018 (45 → 8 untagged code blocks). All structural findings (orphans, hidden, stubs, descriptions) confirmed unchanged. |

## Skill-level skips

| Skill | Status | Substitution |
|---|---|---|
| `identify-ai-tells` skill | **NOT INVOKED THIS RUN** | Phase 10 (Theater) is Expanded — not scheduled for Core. If promoted, fall back to manual heuristic checklist (to be written at `evidence/heuristics/ai-tells.md`). |
| `documentation-audit-workflow` skill | Stage gates inlined into this audit's plan; no separate invocation needed |
| `audience-analysis-and-persona-development` skill | Phase 12 (Audience fit) is Expanded — not scheduled for Core |

## Lens-level scheduling decisions for this run

Per the Execution Profile, only the **Core lenses** run in this pass:
- ✅ Preflight, Phase 0, Phase 1 (Inventory), Phase 3 (Technical health), Phase 7 (Metrics), Phase 9 (Drift), Phase 13 (Journey), Phase 14 (Synthesis)
- ⏭ Phase 2 (IA), Phase 4 (Style), Phase 5 (Accessibility), Phase 6 (Agent accessibility), Phase 8 (Doc Detective), Phase 10 (Theater), Phase 11 (Multi-framework content-type), Phase 12 (Audience fit) — recorded in `scoreboard.md` as `not run` with reason "Expanded; not selected for this round"

## Real-signal access (preflight question)

- **PostHog dashboard:** access not confirmed. Phase 7 runs **instrumentation-code audit only**; Phase 7 live-data and Phase 13 real-signal grounding tagged `evidence: instrumentation-only` / `evidence: inferred`.
- **Google Analytics / Search Console:** access not confirmed.
- **Support tickets / GitHub issues / Slack / sales notes / user-research transcripts:** access not confirmed for this run.

## Decisions applied without explicit user confirmation (defaults from plan)

The plan lists 11 decisions to confirm at execution start. The user instructed to "work without stopping for clarifying questions" — defaults applied as below; user can override and we re-run.

| # | Decision | Default applied |
|---|---|---|
| 1 | Frontmatter expansion | Flag-only (do not add new fields) |
| 2 | Tool installation policy | n/a — no node available to install via |
| 3 | AFDocs trigger | Skip (no gh) |
| 4 | Checklist destination | `.agents/skills/brownfield-docs-audit/SKILL.md` in writing repo (portable) |
| 5 | Persona source | n/a — Phase 12 not run |
| 6 | Dirty tree | n/a — tree clean |
| 7 | Analytics/real signal access | None assumed |
| 8 | Ownership + freshness | Ship as proposals/recommendations only |
| 9 | Lens prioritization fallback | Core only |
| 10 | Seven Agent Doc Model | Skipped (no canonical reference provided) — Phase 11 not run anyway |
| 11 | IA-pattern comparison depth | Diagnostic only — Phase 2 not run anyway |

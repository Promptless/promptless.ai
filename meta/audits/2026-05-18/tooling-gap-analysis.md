# Tooling Gap Analysis — Audit 2026-05-18

Per-lens audit-tooling status: what's wired up, what's missing, what's degraded. Read alongside [tooling-spec.md](tooling-spec.md), which proposes the concrete builds.

## Lens-by-lens

| # | Lens | What's in place today | What this audit had to substitute | Gap → spec'd in tooling-spec |
|---|---|---|---|---|
| 1 | Inventory + ROT | Astro content schema (`src/content.config.ts` with `docsSchema()`); generated sidebar (`src/lib/generated/sidebar.json`); manifest script (`scripts/generate-manifest.ts`) | Custom python3 inventory script (`evidence/build-inventory.py`) — no node available; bounded-YAML frontmatter parser; targeted MDX regex | TS-based inventory script + CI report + orphan/ghost CI check |
| 2 | Information architecture | Smoke test (`tests/smoke/smoke.spec.ts`) verifies primary-nav shape | not run | IA-pattern comparison matrix + tree-test scaffolding (optional) |
| 3 | Technical health | `npm run check` (typecheck + build), `npm run test:smoke`, CI workflow `.github/workflows/check.yml` | No lychee, no shellcheck, no node — degraded everything | lychee + shellcheck + code-fence linter + Doc-Detective coverage metric |
| 4 | Style & language | None | not run | Vale + markdownlint + alex + cspell in CI |
| 5 | Accessibility (WCAG) | None | not run | pa11y-ci + alt-text MDX lint + Lighthouse-CI |
| 6 | Agent accessibility | AFDocs scheduled workflow (`.github/workflows/afdocs-scheduled.yml`) enforces score ≥ 100 daily; dynamic `/llms.txt` and `/llms-full.txt` routes | not run | JSON-LD generation for docs pages; llms.txt freshness CI |
| 7 | Docs usage metrics | PostHog instrumented heavily on marketing; `docs/analytics.md` documents event catalog + known issues; `docs/events.md` marketing-event glossary; `annotate-deploy.yml` posts deploy markers | Instrumentation-code audit only (no dashboard access) | 8 named docs events; structured docs-page-view emit; feedback widget; llms.txt access logging |
| 8 | Procedural testing | Doc Detective (`.doc-detective/`) with 1 spec (`clerk-login`), CI workflow `doc-detective.yml` (manual dispatch) | not run; data captured in W3-03 | More Doc Detective specs for top procedures; CI cadence (PR + nightly) |
| 9 | Drift / Gap | Generated sidebar; AFDocs scheduled check (agent-side drift signal) | Custom ripgrep + python3 system-graph extraction; mapping confidence Medium max | TS-based system-graph builder; drift CI on PR; named-checklist enforcement |
| 10 | Theater + ownership + freshness | None | not run | `identify-ai-tells` skill integration; git-derived ownership metrics; freshness-cadence enforcement |
| 11 | Multi-framework content-type fit | Good Docs Project templates vendored at `meta/reference/good-docs-project-template-1.5.0/` | not run; Seven Agent Doc Model reference not provided | Diataxis classifier; agent-doc-model classifier (when canonical ref provided) |
| 12 | Audience fit | None | not run; persona-validation gate not invoked | Persona inventory authoring workflow; coverage-matrix generator |
| 13 | Journey & task success | None | Inspection-based (no real signals); inferred-only findings | Journey-coverage CI; verification-cue MD lint; troubleshooting-presence CI |

## Audit-infrastructure gap (cross-cutting)

**The audit environment lacked Node.js.** This single absence cascaded into degraded execution of Phases 1, 3, 4, 5, 6, 7, 8, 9, 11. The single highest-ROI infrastructure fix is to containerize the audit:

- Dockerfile with pinned Node 20, all 8 lint/check tools, headless Chrome, lychee, shellcheck, yq, jq, ripgrep, python3.
- Preflight script that runs every probe in the capability matrix and fails fast on missing tools rather than silently degrading.

## Existing strengths to preserve

These are working well and the tooling spec should not regress them:

1. **AFDocs scheduled enforcement** — daily run, score ≥ 100 gate. Cheap insurance for agent accessibility.
2. **Doc-Detective bones** — config and CI workflow exist; only the spec library is thin. Building on this is cheaper than picking a new procedural-test tool.
3. **PostHog as the analytics backbone** — marketing instrumentation is rich. Extending into docs is incremental, not new.
4. **Generated sidebar** — single source of truth (`src/lib/generated/sidebar.json`) makes drift checks tractable.
5. **Content schema discipline** — `src/content.config.ts` already enforces title + slug. Extending the schema (add `description`, `page_type`, `audience`) is a one-file change.
6. **Good Docs Project templates already vendored** — template reference is present without external dependency.

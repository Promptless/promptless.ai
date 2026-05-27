# Tooling Spec — Audit 2026-05-18

Build plan for the audit-tooling gaps identified in [tooling-gap-analysis.md](tooling-gap-analysis.md). Each entry: chosen tool, config sketch, CI integration point, exit criteria, ROI tier.

ROI tier guides sequencing:
- **T1** — High ROI, low effort. Ship first.
- **T2** — High ROI, moderate effort.
- **T3** — Moderate ROI; do after T1+T2 land and surface lower-priority gaps.

---

## T1 — Quick wins (≤ 1 day each, addresses 8+ findings)

### S1. Content-schema enforcement (description + page_type required)
- **Addresses:** F-0004 (78% missing descriptions), F-0027 (orphan agent-knowledge-base manifests as schema-loose), F-0011/F-0023 (lifecycle / pricing gaps that would benefit from `audience` + `page_type` to plan content)
- **Tool:** Astro Zod schema (`src/content.config.ts`) — already exists, extend it.
- **Config sketch:**
  ```ts
  // src/content.config.ts
  const docs = defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        description: z.string().min(20),               // require + minimum length
        page_type: z.enum([
          'concept','quickstart','how-to','tutorial',
          'reference','troubleshooting','release-notes','glossary'
        ]).optional(),
        audience: z.array(z.enum([
          'tech-writer','engineer','support','security-reviewer','admin','oss-maintainer'
        ])).optional(),
        last_reviewed: z.coerce.date().optional(),
        owner: z.string().optional(),
      }),
    }),
  });
  ```
- **CI hook:** existing `npm run check` (astro check). Soft-launch: make `description` required but `page_type` / `audience` / `owner` / `last_reviewed` optional; then escalate after content backfill.
- **Exit criteria:** zero pages fail `astro check` after backfill.
- **Effort:** ~2 hours schema; backfill is a content task (separate).

### S2. Sidebar-orphan CI check
- **Addresses:** F-0003 (orphan pages)
- **Tool:** Small TS script + `tests/smoke/orphan.spec.ts` (extend existing smoke pattern).
- **Config sketch:**
  ```ts
  // tests/smoke/orphan.spec.ts
  import sidebar from '../../src/lib/generated/sidebar.json';
  import { docsCollection } from '../helpers/load-docs.ts';
  
  // every non-hidden doc must appear in sidebar.json
  // ghosts (sidebar entries without matching MDX) must also pass
  ```
- **CI hook:** runs in existing `.github/workflows/check.yml`.
- **Exit criteria:** orphan list is empty OR each orphan has explicit `sidebar.hidden: true`.
- **Effort:** ~1 hour.

### S3. Markdownlint MD040 (fenced-code-language) + alt-text rule
- **Addresses:** F-0005 (zero alt-text), F-0018 (untagged code fences)
- **Tool:** `markdownlint-cli2` with custom rules.
- **Config sketch:**
  ```jsonc
  // .markdownlint-cli2.jsonc
  {
    "config": {
      "MD040": true,             // fenced-code-language required
      "MD045": true              // no-alt-text on images
    },
    "globs": ["src/content/docs/**/*.mdx"]
  }
  ```
- **CI hook:** new step in `check.yml`.
- **Exit criteria:** zero violations OR explicit exclusions for known cases.
- **Effort:** ~30 min config; ~2-3 hours backfill (45 untagged blocks + 10 alt-text pages).

### S4. Lychee link checker
- **Addresses:** F-0029 (link reachability unverified)
- **Tool:** [lychee-action](https://github.com/lycheeverse/lychee-action) GH Action.
- **Config sketch:**
  ```yaml
  # .github/workflows/links.yml
  name: link-check
  on:
    schedule: [{ cron: '0 14 * * 1' }]   # Weekly Monday
    pull_request: { paths: ['src/content/docs/**'] }
  jobs:
    lychee:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: lycheeverse/lychee-action@v2
          with:
            args: --no-progress 'src/content/docs/**/*.mdx'
  ```
- **CI hook:** new workflow.
- **Exit criteria:** zero broken links (with explicit allowlist for known-flaky external sites).
- **Effort:** ~30 min.

### S5. Markdown trailing-line-continuation check (bash blocks)
- **Addresses:** F-0001 (truncated helm command)
- **Tool:** Custom markdownlint rule (or shell script using `awk`). **`shellcheck` does NOT catch this** — the amendment pass confirmed: `shellcheck v0.11.0` flagged only the missing shebang (SC2148); `bash -n` accepts the trailing `\` as syntactically valid because shells terminate the command at EOF. So a custom rule is required, not a standard lint.
- **Config sketch:**
  ```awk
  # scan fenced bash blocks; flag any block whose last non-empty content line
  # ends with " \" (line continuation followed by EOF rather than continuation)
  /^```(bash|sh|shell)$/,/^```$/ {
    if ($0 == "```") { if (prev ~ / \\$/) print FILENAME ":" NR-1 " trailing line continuation"; prev=""; next }
    prev = $0
  }
  ```
- **CI hook:** small step in `check.yml` or as a custom markdownlint-cli2 rule file (`scripts/lint-rules/no-trailing-bash-continuation.js`).
- **Exit criteria:** zero trailing-`\` in fenced bash blocks.
- **Effort:** ~2 hours rule + 5 minutes one-off `rg` scan to confirm baseline.

---

## T2 — Higher leverage, moderate effort

### S6. Docs analytics event catalog (8 events) + Posthog instrumentation
- **Addresses:** F-0008, F-0019, F-0020, F-0021 (full Phase 7 instrumentation cluster)
- **Events to add to PostHog:**
  | Event | When | Required properties |
  |---|---|---|
  | `docs_page_viewed` | On Starlight page render | `{ slug, title, section, page_type, has_description, hidden }` |
  | `docs_helpful_voted` | "Was this helpful?" widget click | `{ slug, vote: thumbs_up\|thumbs_down }` |
  | `docs_code_copied` | Copy button on fenced code | `{ slug, language, block_index }` |
  | `docs_searched` | Pagefind search submit | `{ query_hash, result_count }` |
  | `docs_external_link_clicked` | Any external `[text](https://...)` | `{ slug, href_host, href_path }` |
  | `docs_integration_cta_clicked` | Click-through to `app.gopromptless.ai` | `{ slug, integration_id }` |
  | `docs_llms_txt_fetched` | Server-side, on `/llms.txt`/`/llms-full.txt` access | `{ ua_class: human\|known_agent\|other, route }` |
  | `docs_step_visible` | Each `<Steps>` step scrolled past (optional, lower ROI) | `{ slug, step_index }` |
- **Implementation:** layout-level effect that emits `docs_page_viewed` with structured props; per-event handlers in shared Starlight overrides; server-side hooks in `src/pages/llms*.txt.ts`.
- **CI hook:** content-schema-enforced naming convention (events.md catalog must be updated when emitting a new event).
- **Exit criteria:** 8 events live; `docs/events.md` extended with "Documentation Events" section; first dashboard tile published.
- **Effort:** ~1 day for 8 events + catalog update.

### S7. Doc Detective procedural-accuracy expansion (Phase 13 sub-lens)
- **Lens home:** Phase 13 (procedural-accuracy sub-lens; absorbs former Phase 8).
- **Addresses:** F-0006 — procedural accuracy currently unmeasured (0 of 17 documented procedures have tests, either spec or inline).
- **What "procedural accuracy" means here:** pass = "this documented procedure produces the documented outcome"; fail = "the docs say to do X but X doesn't produce Y". The signal is pass/fail, not test-count.
- **Two complementary authoring styles supported:**
  - **Spec files** at `.doc-detective/tests/*.spec.json` — recorded scripts, good for procedures that don't read naturally as inline tests (auth flows, multi-system orchestration).
  - **Inline tests** in MDX body — Doc Detective parses `{ *doc-detective ... }` and `<!-- doc-detective ... -->` markers placed alongside the prose they verify. The dev config (`.doc-detective.json`) already points at `src/content/docs` recursively, so inline tests in MDX bodies will be picked up automatically. The `detectSteps: false` setting means *only explicit markers* are tested — turn this on if the team wants Doc Detective to auto-derive tests from `<Steps>` blocks.
- **Target (next audit cycle):** test the top 5 procedures (Slack mention, GitHub PR trigger setup, Confluence connect, env-var-add, capture-credentials). 5 of 17 = ~30% coverage — modest, but the 5 are the highest-impact procedures by user-volume estimate. Each can land as a spec file OR as inline markers in the relevant MDX page — pick whichever fits the procedure's shape.
- **CI hook:** existing `.github/workflows/doc-detective.yml` workflow already exists; move from `workflow_dispatch` to `pull_request` for the auth-light procedures and keep manual dispatch for credentialed ones. Failures become PR comments and elevate Phase 13 finding severity per the calibration regime.
- **Exit criteria:** 5 procedures have tests landing in green on every PR; per-procedure pass/fail table in `journey-report.md` after the next audit; F-0006 closes when ≥5 procedures are tested AND the tests pass.
- **Effort:** ~2-3 hours per spec/inline-test (depending on auth setup) = 1-2 days total.

### S8. Drift CI check
- **Addresses:** F-0009 (env vars missing), F-0010 (release trigger missing), F-0022 (beta lifecycle), and future drift
- **Tool:** TS script that builds system graph + doc graph from the same repo and emits a JSON drift report on every PR.
- **Components:**
  ```ts
  // scripts/audit-drift.ts
  // 1. Build system graph (routes, components, env vars, integration list)
  // 2. Build doc graph (content collection + sidebar)
  // 3. Compute drift sets (Missing / Potential / Orphaned)
  // 4. Emit drift.json artifact + summary to PR comment
  ```
- **CI hook:** new workflow `drift.yml`; PR check.
- **Exit criteria:** drift summary appears on every PR; baseline drift report ≤ N items (set N at first run).
- **Effort:** ~1-2 days.

### S9. Verification-cue MD lint
- **Addresses:** F-0026 (sparse verification cues)
- **Tool:** Custom markdownlint rule: every `<Steps>` block must end with a step whose verb is in `{Verify, Confirm, Check, See}`.
- **CI hook:** added to `.markdownlint-cli2.jsonc`.
- **Exit criteria:** zero `<Steps>` blocks without verification (advisory at first; blocking after backfill).
- **Effort:** ~3 hours rule + backfill is editorial.

---

## T3 — Strategic / longer effort

### S10. Containerized audit environment
- **Addresses:** F-0007 (audit env lacked Node) — *meta*-fix
- **Tool:** Dockerfile + Makefile.
- **Config sketch:**
  ```dockerfile
  # meta/audits/audit.Dockerfile
  FROM node:20-bookworm-slim
  RUN apt-get update && apt-get install -y \
      ripgrep jq yq shellcheck python3 python3-pip git curl \
      && curl -L https://github.com/lycheeverse/lychee/releases/...
  RUN npm install -g vale markdownlint-cli2 alex cspell pa11y-ci @lhci/cli
  # Optional: install Chrome for pa11y-ci / lighthouse
  ```
- **CI hook:** new `meta/audits/run-audit.sh` that mounts the repo and runs the audit script.
- **Exit criteria:** `make audit` runs end-to-end with no environmental skips on a clean machine.
- **Effort:** ~1 day.

### S11. Decision-support page authoring (editorial; not tooling per se)
- **Addresses:** F-0012, F-0028, F-0014 (decision-support and audience walls)
- **Not a tool, but listed here because the *enabling* tooling is content-schema fields:** ensure `page_type: 'decision'` is in the schema enum; ensure cross-references from feature pages to decision pages can be enforced.
- **CI hook:** if a feature page declares `decision_axes` in frontmatter, a corresponding decision page must exist.
- **Effort:** schema 30 min; the editorial work is separate.

### S12. AI-tells + ownership-signal scaffolding
- **Addresses:** F-0015, F-0016 (stub and hidden content)
- **Tool:** Script that runs `git log` analytics per page; produces `theater-report.md` content for the next audit.
- **CI hook:** monthly cron, produces `meta/audits/_latest/theater-snapshot.md`.
- **Exit criteria:** snapshot exists and is reviewable.
- **Effort:** ~3-4 hours.

### S13. JSON-LD on docs pages (TechArticle / HowTo)
- **Addresses:** Phase 6 gap noted in audit; not a top-rated finding but a recurring agent-accessibility ask
- **Tool:** Starlight `Head.astro` override or `pages/[...slug].astro` injection.
- **Exit criteria:** every doc page has appropriate JSON-LD; AFDocs score improves.
- **Effort:** ~2-3 hours.

### S14. DARI-docs as a Phase 13 sub-lens (Agent task-success simulation)
- **Addresses:** F-0011 (first-success not orchestrated), F-0014 (security-reviewer walls), F-0025 (troubleshooting inverted), F-0026 (verification cues sparse). DARI is the empirical complement to all of these — instead of inferring whether a user gets stuck, simulate one and observe.
- **Tool:** [`dari-docs`](https://github.com/mupt-ai/dari-docs) CLI. **Default mode: self-managed** (runs against agents in the user's own dari.dev org).
- **Why this fits Phase 13:** DARI tests *task success criteria empirically*. The output (stuck-at-step + reason) is the same shape as Phase 13's existing journey-stage signals. AFDocs (Phase 6) tests content parsability for agents; DARI tests content actionability for agents — complementary, not duplicative. Doc Detective (Phase 8) tests recorded scripts; DARI tests open-ended agent attempts — complementary mechanisms.
- **Setup:**
  ```bash
  # Install
  go install github.com/mupt-ai/dari-docs/cmd/dari-docs@latest
  # or curl -fsSL https://raw.githubusercontent.com/mupt-ai/dari-docs/main/install.sh | bash

  # Self-managed mode requires dari.dev API key + deployed tester/editor agents
  export DARI_API_KEY=...
  # Agent IDs come from the user's dari.dev org
  ```
- **Starter task set** (lives at `meta/audits/<date>/evidence/dari/tasks.yml`):
  ```yaml
  tasks:
    - id: connect-slack
      description: "Connect Slack and have Promptless watch one channel"
    - id: configure-github-pr-trigger
      description: "Configure a GitHub PR trigger on a specific repository"
    - id: set-up-sso-saml
      description: "Set up SSO via SAML for the organization"
    - id: self-host-helm
      description: "Self-host Promptless on Kubernetes using the Helm chart"
    - id: send-api-trigger
      description: "Send an API trigger and verify the response"
  ```
- **Invocation pattern:**
  ```bash
  dari-docs check ./src/content/docs --task "@meta/audits/2026-XX-YY/evidence/dari/tasks.yml#connect-slack"
  # Results land in .dari-docs/; copy/symlink to evidence/raw/dari-runs/<task-slug>.json
  # NEVER use --apply during an audit — the audit does not rewrite content
  ```
- **CI integration:** new workflow `.github/workflows/dari-scheduled.yml`, weekly cadence, posts results as a check-suite. Failures (≥1 agent stuck) become PR comments referencing the affected page.
- **Calibration regime** (enforced in `journey-report.md` and `findings.md`):
  - Findings tagged `evidence: simulated-agent`
  - Confidence cap: **Medium** unless ≥2 agents stuck at the same step (then High)
  - Mandatory false-positive notes — "agent stuck because docs are ambiguous" vs. "agent stuck because the task is genuinely hard"
  - Never use DARI failures alone to elevate severity above Significant; combine with other lens evidence (e.g., F-0011 corroboration) to reach Critical
- **Exit criteria:** all 5 starter tasks have at least one DARI run logged in `evidence/raw/dari-runs/`; per-task stuck-step rate computed; the `journey-report.md` carries an "Agent task-success simulation" section with the per-task table.
- **Effort:** ~half-day setup (install + auth + agent deployment in dari.dev org) + ongoing per-audit-cycle execution (~30 min per task × N tasks).
- **Cross-references:** S2 (sidebar-orphan CI check) catches structural inputs to DARI failures; S6 (analytics events) provides a real-user-signal channel that DARI augments rather than replaces.

### S15. Canonical page-level data merger (already shipped this audit)
- **Status:** **Implemented** as `evidence/build-page-data.mjs` in the 2026-05-18 audit. Produces `evidence/page-data.csv` + `evidence/page-data.json`.
- **What it does:** Reads from every per-lens raw output keyed at the page level (inventory.json, inventory-ast.json, classification.csv, ownership.json, ai-tells/_aggregate.json, vale.json, cspell.json, pa11y.json, instrumentation.csv, afdocs-latest.json's llms.txt content, findings.md) and emits one row per published page with ~45 columns spanning every lens.
- **Why:** Reviewers asking *"what do we know about page X?"* had to cross-reference too many files. `page-data.csv` is the single front door.
- **CI integration:** runs as the final step of Phase 14 synthesis on every audit. Idempotent — re-runs produce identical output.
- **Effort:** ~done. Future audits should keep the merger in sync as new per-lens outputs are added (e.g., add a `dari_*` column family once S14 lands).

---

## Sequencing recommendation

**Week 1 (T1):** S1 (schema), S2 (orphan check), S3 (markdownlint), S4 (lychee), S5 (line-continuation lint). ~5–7 person-days. Closes 6 findings outright; provides baseline metrics for the rest.

**Week 2–3 (T2):** S6 (analytics events), S7 (Doc Detective expansion), S8 (drift CI), S9 (verification lint), **S14 (DARI integration)**. ~6–8 person-days. Closes another 5 findings; unblocks data-driven prioritization for the next audit; provides empirical agent-task signal feeding Phase 13.

**Week 4+ (T3):** S10 (audit container) — do early if a second audit is scheduled. S11/S12/S13 in remaining time. S15 (page-data merger) already implemented.

After this sequence the next audit can run end-to-end (all 12 lenses, with Doc Detective procedural-accuracy and DARI agent-simulation as sub-lenses within Phase 13) in **2–4 hours** instead of the multi-pass days this run took, because the environment is reproducible, most automated checks self-report, and `page-data.csv` is the single front door for any per-page question.

## What NOT to build in this round

A few things I considered and explicitly declined:

- **A custom Diataxis classifier.** Until Phase 11 is run on substance, building it is premature. Skill-mode call to `identify-ai-tells`-like classifier per page would work; specifying its design now is over-engineering.
- **A bespoke audit-output viewer.** Markdown + CSV in a dated dir is enough. Adding a UI is a procrastination move.
- **A "score" per page.** The severity rubric works at the finding level; aggregating to a per-page score implies false precision.
- **Audit-as-a-skill installation.** Wait until the second audit run validates that the checklist holds up before formalizing it as a skill.

## Reference: where in the repo each tool lands

| Tool / config | Path |
|---|---|
| Astro content schema | `src/content.config.ts` (extend) |
| markdownlint config | `.markdownlint-cli2.jsonc` (new) |
| Lychee config | `lychee.toml` (new) + `.github/workflows/links.yml` (new) |
| Drift script | `scripts/audit-drift.ts` (new) |
| Custom md rule (line continuation, verification cues) | `scripts/lint-rules/*.js` (new) |
| Doc Detective specs | `.doc-detective/tests/*.spec.json` (extend) |
| Audit container | `meta/audits/audit.Dockerfile` + `meta/audits/run-audit.sh` (new) |
| PostHog event handlers | `src/components/starlight/*.astro` overrides + `src/pages/llms*.txt.ts` (extend) |
| Updated event catalog | `docs/events.md` (extend with Documentation Events section) |

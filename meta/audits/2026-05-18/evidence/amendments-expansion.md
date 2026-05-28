# Audit Amendments — Expansion run (2026-05-18, post-gh + Vale + Seven Action Model)

This is the second amendment pass. Triggers:
- `gh` CLI installed → Phase 6 deeper analysis now reachable
- Seven Action Model canonical reference provided by user (`https://passo.uno/seven-action-model/`) → Phase 11 third axis unblocked
- `brew install vale` approved → Phase 4 fully reachable
- User directive: *"do everything else you are now technically enabled to perform"* (excluding Doc Detective full execution)

The first amendment pass is documented in [`amendments.md`](amendments.md). This expansion run produced an additional **8 new findings** and **6 amendments to existing findings**.

## Re-execution log

| Action | Result |
|---|---|
| `vale --version` | 3.14.2 (via brew) |
| `vale sync` Microsoft + Google + write-good | Synced to `~/Library/Application Support/vale/styles` |
| `vale --output=JSON` over docs | 4235 alerts (1025 error / 1240 warning / 1970 suggestion) across 55/59 files; top rule Vale.Spelling (852) is mostly product nouns |
| `cspell` with project dictionary | 18 issues across 11 files; **1 real misspelling found**: `compatibile` → `compatible` in kubernetes-helm.mdx:45 |
| `gh auth status` | logged in as `hawkeyexl`; 5 successful AFDocs runs in last 5 days |
| `gh run view` on AFDocs scheduled run | Score 100, 21 pass / 1 warn / 1 skip |
| `npx afdocs check https://promptless.ai --format json --score` | full 6719-line report saved to `evidence/raw/afdocs-latest.json` |
| `pa11y-ci` full sweep across 51 docs URLs | 154 issues total: 153 footer-contrast (F-0030 site-wide) + 1 iframe-title |
| `curl` Seven Action Model reference | Fetched and distilled; 7 actions = Appraise / Understand / Explore / Practice / Remember / Develop / Troubleshoot |
| Per-page `identify-ai-tells` skill on 3 sample pages | 1 weak verdict, 2 moderate; reports in `evidence/raw/ai-tells/*.md` |
| Aggregate heuristic AI-tells scan across 55 pages | 3 high-signal (≥4 score), 3 moderate, 49 low/clean |
| Git-derived ownership facts | 27 single-committer (46%), 36 low-edit ≤2 commits (61%), 23 both |
| Multi-framework classification (Good Docs + Diataxis + Seven Action) | `evidence/classification.csv` — 59 rows × 3 frameworks |
| Strategy-level persona × page-type matrix | 6 personas derived; 5 empty cells visible in `audience-fit-report.md` |

## Amendments to existing findings

| Finding | Original status | Amended status | Reason |
|---|---|---|---|
| **F-0030** Footer contrast WCAG fail | Significant; sampled on 1 page in earlier amendment | **Significant; confirmed site-wide** | pa11y-ci full sweep: 51 docs URLs × 3 H3s each = 153 of 154 total issues. Affects every doc page. |
| **F-0031** llms.txt covers 96% of sitemap | Moderate | **Withdrawn (out of scope)** | The 3 missing URLs are `/changelog/`, `/meet/`, `/use-cases/technical-writer-power-tool/` — none under `docs/`. For docs scope specifically, llms.txt coverage is **100%**. AFDocs `llms-txt-coverage` check passes. |
| **F-0032** Markdown/HTML content parity drift | Moderate | **Withdrawn (out of scope)** | The 3 affected pages are all `/blog/*`. Out of audit scope per the original scope statement. For docs pages: 0 parity issues. |
| **F-0017** 21 pages with zero inbound docs links | Moderate; tagged `evidence: degraded-parser` | Moderate; confirmed | AST scan corroborates the 21-page list. Same pages, same finding. |
| **F-0029** External link reachability | Low; verified in first amendment | Low; further confirmed | Already amended; this run did not need to re-test. |

## New findings (8 total)

### F-0033 — Two singleton top-level sidebar groups
- **Lens:** Phase 2 — IA
- **Severity:** Moderate
- **Page/entity:** `sidebar.json` — "Account Management" group has 1 leaf, "Frequently Asked Questions" group has 1 leaf
- **Evidence:** `ia-report.md` sidebar-shape table; raw `src/lib/generated/sidebar.json` inspection
- **Why it matters:** Singleton groups dilute the IA's signal-to-noise. Users browsing 7 top-level groups expect each to be a substantive area; "Account Management" with 1 page reads as a structural inheritance, not a real category. Fold into "Configuring Promptless" or "Getting Started".
- **Confidence:** High.
- **Remediation type:** Consolidate.
- **Automation candidate:** Yes — sidebar shape can be lint-checked (warn if top-level group has <3 leaves).
- **False-positive notes:** Could be deliberate emphasis on those sections; if so, they should grow rather than shrink to their current single-leaf form.

### F-0034 — Inconsistent beta-status convention (label vs slug)
- **Lens:** Phase 2 — IA / naming consistency
- **Severity:** Low
- **Page/entity:** 5 labels use "(Beta)" parenthetical: Microsoft Teams Messages, Intercom Tickets, LaunchDarkly Integration, Microsoft Teams Integration, Intercom Integration. 3 slugs use `-beta` suffix: `intercom-tickets-beta`, `intercom-integration-beta`, `launchdarkly-integration-beta`. Microsoft Teams labels use parenthetical but no slug suffix.
- **Evidence:** sidebar.json + inventory.csv slug column
- **Why it matters:** Inconsistent convention creates URL churn risk when betas graduate (slugs change → redirects required) and confuses users about what "beta" means. Either commit to slug-suffix (and rewrite Teams slugs) or label-only (and rewrite Intercom/LaunchDarkly slugs).
- **Confidence:** High.
- **Remediation type:** Improve.
- **Automation candidate:** Yes — pair with F-0022 (beta lifecycle policy) so policy + naming convention land together.

### F-0035 — Vale baseline: 4235 alerts (1025 errors) across 55/59 files; mostly product nouns
- **Lens:** Phase 4 — Style & language
- **Severity:** Moderate (baseline only; needs project dictionary curation before enforcement)
- **Page/entity:** (global)
- **Evidence:** `evidence/raw/vale.json`. Top rules: Vale.Spelling (852, mostly product nouns), write-good.E-Prime (428), Google.Headings + Microsoft.Headings (291 each, sentence-case enforcement), Passive (193 × 3 styles), Google.Parens (174), Microsoft.We + Google.We (157 each).
- **Why it matters:** Vale is now baseline-scanning the docs but with 4235 alerts and no project dictionary, the signal-to-noise is poor. The right next step is curating a project dictionary (most spelling alerts are product nouns) and selecting/deselecting style rules per the team's voice preferences, then locking in a baseline.
- **Confidence:** High on the count; Low confidence that all 4235 are real (most spelling are false positives without dictionary).
- **Remediation type:** Spec-only (configure Vale; pick rules to enforce; bake into CI).
- **Automation candidate:** Yes — Vale CI is the standard tool here.

### F-0036 — cspell finds one real misspelling: `compatibile`
- **Lens:** Phase 4 — Style & language
- **Severity:** Low
- **Page/entity:** `src/content/docs/docs/self-hosting/kubernetes-helm.mdx:45`
- **Evidence:** `cspell --config /tmp/cspell.json` output: "compatibile → fix: compatible".
- **Why it matters:** A simple typo on a Critical-risk-class page (self-hosting). Low impact but trivially fixable.
- **Confidence:** High.
- **Remediation type:** Fix.
- **Automation candidate:** Yes — cspell in CI catches all single-word typos once the project dictionary is curated.

### F-0037 — 0 of 94 built docs HTML pages carry JSON-LD structured data
- **Lens:** Phase 6 — Agent accessibility
- **Severity:** Moderate
- **Page/entity:** All 94 built `dist/docs/*.html` pages
- **Evidence:** `rg -l 'application/ld\+json' dist/docs/` returns zero matches; only `dist/jobs/index.html` and the WTD event page have JSON-LD (JobPosting and Event schemas).
- **Why it matters:** For an AI-product audience, structured data is a meaningful agent-accessibility signal. `TechArticle` schema on every doc page (with author, datePublished, headline, articleSection) would meaningfully improve agent comprehension. AFDocs doesn't gate on this today, but the spec does mention it.
- **Confidence:** High.
- **Remediation type:** Create — Starlight `Head.astro` slot can inject JSON-LD per page from frontmatter.
- **Automation candidate:** Yes.
- **False-positive notes:** JSON-LD is a recommendation, not a requirement. Skipping it is acceptable; the finding is "candidate opportunity", not a defect.

### F-0038 — Ownership concentration: 61% of pages have `promptless[bot]` as last author
- **Lens:** Phase 10 — Ownership signal (risk indicator, not verdict)
- **Severity:** Moderate
- **Page/entity:** (global) — 36 of 59 pages
- **Evidence:** `evidence/raw/ownership.json`; per-author distribution: promptless[bot]=36, Prithvi Ramakrishnan=22, InlinePizza=1
- **Why it matters:** Ownership accountability is unclear when a bot is "the last author" on most pages. The bot opens PRs; humans review and merge them, but git log doesn't show the reviewer. A docs-owner-in-frontmatter convention would separate "what got machine-touched" from "what got human-validated".
- **Confidence:** Medium (the count is High but its meaning depends on PR review practices, which aren't visible from `git log`).
- **Remediation type:** Spec-only (proposed ownership model in `theater-report.md`).
- **Automation candidate:** Yes — frontmatter schema can enforce owner; CI can verify human review on owner-flagged pages.
- **False-positive notes:** This is **dogfooding**, which is a positive product signal — `promptless[bot]` updating Promptless's own docs proves the product works. Treating this as a pure risk would penalize the right behavior. The actual concern is whether humans are reviewing each bot PR.

### F-0039 — 3 High-risk security pages overdue per proposed freshness cadence (60-day window)
- **Lens:** Phase 10 — Freshness
- **Severity:** Moderate
- **Page/entity:** `security-and-privacy/privacy-policy`, `security-and-privacy/single-sign-on-sso-setup`, `self-hosting` (all 82 days old)
- **Evidence:** `evidence/raw/ownership.json` overdue list
- **Why it matters:** All three pages are High-risk class (security, auth, self-hosting). 82 days is the max age in the repo, so these are at-rest content. Stale security/auth content is the kind that fails a security review (compounds F-0002 and F-0014).
- **Confidence:** Medium — cadence is a *proposed* policy, not adopted. "Overdue" is meaningful only when the cadence is real.
- **Remediation type:** Decide cadence + refresh.
- **Automation candidate:** Yes — once cadence policy is adopted, CI can flag overdue pages weekly.
- **False-positive notes:** Pages may not have changed because the underlying policy hasn't changed. Compare to product/contract changes before refreshing for refresh's sake.

### F-0040 — AI-style indicator cluster on 3 of 55 prose-heavy pages
- **Lens:** Phase 10 — AI-tells (risk indicators, not verdicts)
- **Severity:** Moderate
- **Page/entity:** `security-and-privacy/data-handling-and-classification` (5 indicators, skill verdict: moderate), `how-to-use-promptless/deep-analysis` (em-dash density 5.22 per 300 words), `security-and-privacy/single-sign-on-sso-setup` (6 indicators, skill verdict: moderate). Plus 3 more pages at score 3.
- **Evidence:** `evidence/raw/ai-tells/_aggregate.json`; individual reports for the top 3 in `evidence/raw/ai-tells/`.
- **Why it matters:** Pattern observation, not verdict. Two of the top-3 pages are High-risk security pages — exactly the content that should NOT read as AI-assist-heavy because it has legal/security weight. The trailing boilerplate paragraph on `data-handling-and-classification` (line 78), placed AFTER the contact-us CTA, is the single strongest individual signal.
- **Confidence:** Medium (heuristic) for the aggregate; Medium for the skill-verdict pages (per `identify-ai-tells` documentation).
- **Remediation type:** Improve (review and tighten the top-3 pages; especially the trailing boilerplate).
- **Automation candidate:** Partial — heuristic detection is automatable; the disposition (rewrite vs. leave) is editorial.
- **False-positive notes:** Security/compliance prose genuinely uses formal vocabulary; clustering should not be confused with "this is AI-generated". The "moderate" cluster verdict is "warrants review", not "is AI".
- See [`evidence/raw/ai-tells/`](evidence/raw/ai-tells/) for per-page reports and `theater-report.md` for the aggregate.

## Phase 11 framework-classification observation (no new finding; reinforces existing)

| Framework | Distribution | Pattern |
|---|---|---|
| **Good Docs Project** | 41% how-to, 32% reference, 15% concept, 8% stub, 2% quickstart | Concept underweighted (no real concept pages — 4 of 9 are stubs and 1 is a 1.0 launch announcement) |
| **Diataxis (dominant mode)** | 41% how-to, 32% reference, 15% explanation, 1 tutorial | Explanation is genuinely thin (corroborates the Phase 10 conceptual-model finding) |
| **Seven Action Model** | **44% Develop**, 19% Appraise, 14% Practice, 5% Troubleshoot, 5% Understand, 2% Remember, 2% Explore | **Develop-heavy, Understand/Explore/Practice/Remember under-served** |

The Seven Action coverage is the new structural insight. The docs are **configuration-heavy** (most pages help users *integrate* the product into their environment), with very thin coverage of *Understanding* (how the parts fit), *Exploring* (playful first contact), *Practicing* (training/exercises), and *Remembering* (lookup/reference). Quickstart-as-Explore is a single page, and the Practice and Remember actions essentially share the same Reference content.

This is **not a new finding** per se — it corroborates F-0011 (first success not orchestrated), F-0013 (maintain lifecycle missing), and the conceptual-model finding in W10 — but the Seven Action lens names the pattern: the docs are built for users who have already decided to integrate, not for users who are still appraising, learning, or exploring.

## Phase 12 strategy-level findings (corroborate existing)

The strategy-level matrix in `audience-fit-report.md` produces 6 patterns (S-A through S-F), all of which corroborate already-existing findings:
- S-A → F-0025 (troubleshooting depth inverted)
- S-B → F-0013 (maintain lifecycle missing)
- S-C → F-0028 (pricing) and partial gap for Support persona
- S-D → F-0016 (substantial hidden pages)
- S-E → F-0002 and F-0014 (T&S walls hit security reviewer hardest)
- S-F → F-0011 (first success not orchestrated; persona-specific quickstarts absent)

**No new findings added from Phase 12** — the strategy-level work confirms patterns already surfaced.

## Updated counts after expansion run

| Severity | After first amendment | After expansion | Delta |
|---|---|---|---|
| Critical | 2 | 2 | 0 |
| Significant | 11 | 11 | 0 (F-0030 confirmed site-wide; no new Sig findings) |
| Moderate | 15 | **16** | +1 (8 new Moderate from expansion + 2 amended-to-withdrawn) |
| Low | 3 | **5** | +2 (3 new Low minus 1 reclassification) |
| Withdrawn | 1 (F-0005) | **3** (F-0005, F-0031, F-0032) | +2 |
| **Total active findings** | **31** | **34** | **+3 net** (8 added, 2 withdrawn, 3 unaltered) |

Actually after counting the new findings F-0033 through F-0040 (8 new) and 2 withdrawn (F-0031, F-0032):
- Critical: 2
- Significant: 11 (unchanged)
- Moderate: 15 + 6 new Moderate − 2 withdrawn = 19. Wait, F-0033/F-0035/F-0037/F-0038/F-0039/F-0040 = 6 new Moderate.
- Low: 3 + 2 new Low (F-0034, F-0036) = 5
- **Total: 2 + 11 + 19 + 5 = 37**

Recounted: original 29 + first-amendment-added 3 (F-0030, F-0031, F-0032) − first-amendment-withdrew 1 (F-0005) = 31. Then expansion adds 8, withdraws 2 (F-0031 & F-0032) = 37.

## Tooling status changes

Now fully functional:
- ✓ Vale (with Microsoft + Google + write-good packs)
- ✓ cspell (with project dictionary)
- ✓ pa11y-ci (full sweep across all 51 docs URLs)
- ✓ gh CLI (AFDocs workflow inspection)
- ✓ `identify-ai-tells` skill (per-page)
- ✓ Seven Action Model classification (canonical ref now available)

Still not run:
- Doc Detective full execution (user excluded; needs credentials anyway)
- lighthouse-ci (Phase 5 partial — pa11y-ci substitutes for most a11y checks)
- mdx2vast for native MDX parsing in Vale (workaround: mdx→md mapping in [formats] section)

## New artifacts in this run

| Path | Purpose |
|---|---|
| `evidence/raw/vale.json` | Vale baseline (4235 alerts) |
| `evidence/raw/cspell.json` | cspell results (1 real misspelling) |
| `evidence/raw/pa11y.json` | pa11y-ci full sweep (51 URLs, 154 issues) |
| `evidence/raw/afdocs-latest.json` | AFDocs full scorecard (score 100) |
| `evidence/raw/ownership.json` | Per-page git ownership facts |
| `evidence/raw/ai-tells/_aggregate.json` | Per-page AI-tells heuristic scores |
| `evidence/raw/ai-tells/api-triggers.md` | Per-page AI-tells (skill) |
| `evidence/raw/ai-tells/data-handling-and-classification.md` | Per-page AI-tells (skill) |
| `evidence/raw/ai-tells/single-sign-on-sso-setup.md` | Per-page AI-tells (skill) |
| `evidence/classification.csv` | Multi-framework typing (Good Docs + Diataxis + Seven Action) |
| `evidence/tools-config/vale/.vale.ini` | Vale config |
| `ia-report.md` | Phase 2 Tier 2 |
| `theater-report.md` | Phase 10 Tier 2 |
| `audience-fit-report.md` | Phase 12 Tier 2 (strategy-level only) |

---

## Synthesis-pass addendum (2026-05-18, post-expansion)

After the expansion run completed, three further changes landed via the synthesis pass:

### 1. Canonical page-level data store (Addendum 3 Item 1)

The audit produced too many page-keyed CSVs and JSONs for a reviewer to cross-reference manually. Solution: a single merger that joins them.

**New artifacts:**
- `evidence/build-page-data.mjs` — Node ES-module merger script (~280 lines). Reads inventory.json, inventory-ast.json, classification.csv, ownership.json, ai-tells/_aggregate.json, vale.json, cspell.json, pa11y.json, instrumentation.csv, afdocs-latest.json (llms.txt content), and findings.md (for F-NNNN backlinks). Emits the two outputs below. Idempotent.
- `evidence/page-data.csv` — 60 lines (1 header + 59 published-doc rows). ~45 flat columns spanning every lens that ran. Blank-fills cells where the source lens didn't run.
- `evidence/page-data.json` — same data with nested fields (AI-tell categories, vale top rules, a11y per-rule counts, ownership facts, finding_ids as a proper array, dari_runs as an empty array placeholder).

**Column coverage at production:** 32 of 45 columns at 100% (every page); the rest are blank-filled where legitimate (image_alt_present_ratio only on pages with images; vale/cspell/pa11y/ai-tells where the source had filter exclusions; dari_* spec-only this run).

**Per-page finding backlinks (`finding_ids_semicolon_delimited`):** populated only for findings whose `**Page/entity:**` line names a specific slug. Findings tagged "(global)" or "(audit env)" intentionally don't backlink. Result: F-0001 → kubernetes-helm; F-0003 → the two orphan pages. Other per-page findings (F-0030 footer, F-0036 typo) are global-scoped at their finding level even though they touch specific pages.

**Future audits:** the merger should be re-run as the last step of Phase 14 every time, and the column set extended whenever a new per-lens output appears.

### 2. DARI-docs as Phase 13 sub-lens (Addendum 3 Item 2)

User-provided URL: <https://github.com/mupt-ai/dari-docs> — CLI that sends docs to simulated developer agents for empirical task-success testing.

**Decision (this turn):** Spec only. The framework now treats DARI as a Phase 13 sub-lens (Agent task-success simulation). Default mode: **self-managed** (run against agents in the user's own dari.dev org).

**Documented in:** plan-file Addendum 3 Item 2, Phase 13 description in the plan + checklist, capability matrix (new row), tooling-spec **S14**, scoreboard Phase 13 note.

**No execution this turn** — `dari-docs` not installed, dari.dev credentials not configured. The next audit cycle should:
1. Install `dari-docs` (Go binary; `go install github.com/mupt-ai/dari-docs/cmd/dari-docs@latest`)
2. Deploy tester + editor agents in the dari.dev org
3. Provide `DARI_API_KEY` + agent IDs in preflight env
4. Author `evidence/dari/tasks.yml` starter task set (5 tasks suggested in tooling-spec S14)
5. Run `dari-docs check ./src/content/docs --task ...` per task
6. Findings tagged `evidence: simulated-agent`; cap Medium unless ≥2 agents stuck at the same step

### 3. Execution Profile rewritten: run-everything-runnable

The Core/Expanded staging was retired. The new posture: every lens whose capability probe passes runs by default. A lens is only skipped for **infeasibility** (hard capability missing) or **explicit user opt-out**, both recorded in `evidence/skipped-checks.md`. Per-lens calibration gates (Phase 12 persona validation, Phase 11 Seven Action axis, Phase 10 risk-indicator framing, Phase 13 DARI sub-lens) shape *what* each lens emits but do not change run/skip status.

**Rationale (from the plan):** the previous Core/Expanded staging introduced friction (lenses sat at `not run` even when their capability was available) and produced reports that under-claimed how much the audit actually knew. Three passes were needed in this audit to get all 13 lenses to `complete | preliminary`; the new posture collapses that into one pass after preflight establishes capabilities.

**Migration impact for 2026-05-18:** scoreboard now carries an "Execution-profile note (next-cycle change)" section pointing future readers at the updated profile. The current scoreboard's per-lens statuses remain accurate as a record of what this audit achieved.

## Updated outputs (synthesis pass)

| Path | Status |
|---|---|
| `evidence/build-page-data.mjs` | new |
| `evidence/page-data.csv` | new |
| `evidence/page-data.json` | new |
| `README.md` | added page-data front-door section + 4th-pass note |
| `checklist.md` | rewrote Execution Profile section; added DARI sub-lens to Phase 13; added page-data merger step to Phase 14 |
| `tooling-spec.md` | added **S14** (DARI integration) + **S15** (page-data merger; status: implemented); updated sequencing recommendation |
| `scoreboard.md` | added canonical per-page lookup pointer + execution-profile-update note; tagged DARI sub-lens as spec-only on Phase 13 row |
| `evidence/commands.log` | appended synthesis-pass commands |
| `evidence/amendments-expansion.md` | this section |

---

## Fourth-pass addendum (2026-05-18, Phase 8 folded into Phase 13)

User correction: *"The Doc Detective testing should also fall under Journey & Task Success. Those aren't just about counting Doc Detective tests (especially because tests can be written inline as body content in the docs), but passing/failing tests indicate procedural accuracy."*

### Structural change

**Phase 8 was folded into Phase 13** as a third sub-lens (alongside inferred journey assessment and DARI agent simulation). The new sub-lens is **"Procedural accuracy (Doc Detective)"**. The framework's lens count drops from 13 to 12.

**Rationale:** Doc Detective tests — whether `.spec.json` files OR inline MDX markers — are *procedural-accuracy probes*: pass = "this documented procedure works as written"; fail = "the docs say to do X but X doesn't produce Y". That's the same shape of signal Phase 13 measures (task success), and DARI is already there with a complementary mechanism. Counting test files alone (the old Phase 8 framing) is a non-finding; pass/fail rate is the task-success signal.

### Discovery additions to the merger

`evidence/build-page-data.mjs` gained Doc Detective discovery columns:

| Column | Semantics |
|---|---|
| `dd_steps_block_count` | Number of `<Steps>` procedure blocks in this page (the population to cover) |
| `dd_inline_marker_count` | Number of inline Doc Detective markers in MDX body (`{ *doc-detective ... }`, `<!-- doc-detective ... -->`) |
| `dd_test_covered` | True when this page has an inline marker; spec-file coverage requires a per-page → spec map (TBD) |
| `dd_test_passed` / `dd_test_failed` / `dd_last_run` | Execution data; blank this run; populated when Doc Detective workflow runs with credentials |

Discovery uses Node-native filesystem scanning (not `rg`) because the `rg` command in this audit environment is a shell function that `execSync`'s `/bin/sh` cannot resolve.

### Discovery results for 2026-05-18

- **1 spec file** in `.doc-detective/tests/` (`login.spec.json` — tests Clerk auth; does not map to any documented procedure)
- **0 inline markers** in any of the 59 MDX files
- **17 documented procedures** across 10 pages (the population)
- **0% procedural-accuracy coverage** — none of the 17 procedures has a test

This data is now visible in `page-data.csv` and summarized in `journey-report.md`'s new "Procedural accuracy" section.

### Cascade of changes

| File | Change |
|---|---|
| Plan file Phase 8 section | Replaced with a redirect to Phase 13's procedural-accuracy sub-lens |
| Plan file Phase 13 section | Added "Procedural accuracy (Doc Detective)" sub-lens; added the distinguishing-the-two-sub-lenses paragraph (Doc Detective vs DARI) |
| Plan file lens count | 13 → 12; numbering retains gap at Phase 8 to preserve cross-references |
| Plan file capability matrix | Added Doc Detective row pointing to Phase 13 with discovery-vs-execution halves |
| Plan file Phase 3 description | Removed the Doc Detective coverage bullet (moved to Phase 13) |
| Plan file finding-schema example | `<one of the 13 lenses>` → `<one of the 12 lenses (Phase 8 folded into Phase 13)>` |
| Plan file lens list | Phase 8 line is now a folded-marker reference |
| `findings.md` F-0006 | Reframed: lens is now Phase 13 (procedural-accuracy sub-lens); title says "Procedural accuracy is unmeasured: 0 of 17 documented procedures are tested"; explicit note about inline-test absence |
| `scoreboard.md` | Phase 8 row marked `folded`; Phase 13 row notes the absorbed sub-lens + the three-sub-lens structure; Phase 3 row's Significant count adjusted (F-0006 moved out) |
| `checklist.md` | Phase 8 section replaced with a fold redirect; Phase 13 section adds the procedural-accuracy checklist and the distinguishing-from-DARI paragraph |
| `tooling-spec.md` S7 | Reframed: now "Doc Detective procedural-accuracy expansion (Phase 13 sub-lens)"; explicit support for both spec-file AND inline-test authoring styles; exit criteria changed from "5 specs pass green" to "5 procedures have tests landing in green AND tests pass" |
| `journey-report.md` | New "Procedural accuracy (Doc Detective sub-lens; absorbs former Phase 8)" section with discovery data, coverage table, per-page procedure load, and interpretation |
| `evidence/build-page-data.mjs` | Added the Doc Detective discovery walker; added six new schema columns |
| `evidence/page-data.csv` | Regenerated with 6 new columns (3 populated, 3 blank pending execution) |
| `evidence/page-data.json` | Regenerated to match |
| `evidence/amendments-expansion.md` | This addendum |

### Net impact on findings

- **No new findings added.** F-0006 already existed; it changes lens-affiliation only.
- **F-0006 severity unchanged** (Significant). It now lives under Phase 13 rather than straddling Phase 3 / Phase 8.
- **Phase 13 finding counts updated:** Significant 4 → 5 (F-0006 moved in); Moderate stays 4. Total active findings remain 37.
- **Lens count: 13 → 12.** Phase 8 row in scoreboard is now `folded`; numbering preserved.

---

## Fifth-pass addendum (2026-05-27, team-shareable HTML report)

User request: *"Create the report according to the previously generated results."* — generate a single team-shareable HTML report from the audit deliverables.

### Design choices (captured per prior turn)

- **Style:** neutral utilitarian (system fonts, no brand colors).
- **Interactivity:** rich (inline SVG charts, filterable findings, sortable tables, search, drill-downs).
- **Self-contained:** single HTML file with embedded CSS + JS; no external CDN.

### Output

- **`meta/audits/2026-05-18/report.html`** — 290,663 bytes single HTML file
- **`meta/audits/2026-05-18/evidence/build-report.mjs`** — the generator (~1100 lines); idempotent

### Sections rendered

1. Header banner with 8 count cards (37 active findings, severity breakdown, lens count, page count, audit-pass count)
2. Executive summary (4 paragraphs, leadership-friendly)
3. At-a-glance dashboard:
   - Severity stacked-bar (inline SVG)
   - Lens-status donut + legend
   - Audit pass timeline (5 nodes, 5 evolution passes)
   - Lens scoreboard table (sortable on every column)
   - Top 5 findings cards (Critical + first 3 Significant)
4. The 12-lens framework (Phase 8 marked folded; cards for each phase)
5. Process narrative (5 passes told as a story + audit-infrastructure lessons)
6. Findings (40 cards: 37 active + 3 withdrawn; severity-chip filter; lens dropdown; search box; collapsible per-card)
7. Per-page data explorer (59 rows × 15 default cols; sortable + searchable; CSV download button)
8. Per-lens reports (7 embedded Tier 2 reports as collapsible details: inventory, IA, metrics, drift, theater, audience-fit, journey)
9. Recommendations & sequencing (15 items grouped T1/T2/T3)
10. Reusable artifacts
11. Appendix (severity rubric, finding schema, amendments log, evidence trail, about-this-report)

### Charts (vanilla inline SVG, no chart library)

- Severity stacked horizontal bar
- Lens-status donut
- 5-node audit-pass timeline
- 8-cell journey-stage strip
- AI-tell signal histogram
- 6×6 persona × page-type heatmap

### Interactivity (vanilla JS)

- TOC scrollspy
- Severity chip filter on findings
- Lens dropdown filter
- Full-text search on findings titles + entity
- Sortable tables (lens scoreboard, page-data)
- Page-data search-as-you-type
- CSV download button (Blob URL of filtered table)
- Collapsible per-finding cards; hash-driven auto-expand for `#F-NNNN` deep-links
- Print stylesheet (sidebar hidden, all sections expanded, sensible page breaks)

### Generator iterations + bug-fixes (recorded for the checklist)

1. **First run:** parser counted F-0007 and F-0018 twice each (they appear under their original severity *and* in the Low cross-reference section). 42 findings registered for 40 unique IDs.
2. **Dedupe by ID:** kept first occurrence's schema content, applied last occurrence's severity. Got to 40 unique with 36 active + 3 withdrawn = 39 (1 short of expected 40).
3. **Block-trim:** F-0029 was the last F-NNNN in findings.md; its block extended into the working-notes section, picking up a stray `**Severity:**` line from W3-05. Fix: split each block at the next `### `, `## `, or `---` heading. Recovered F-0029 to its correct Low classification, but Moderate count still short by 1.
4. **Severity normalization:** F-0035's explicit `**Severity:** Moderate (baseline only; needs project dictionary curation before enforcement)` was being captured verbatim, so `severity === 'Moderate'` filter excluded it. Fix: normalize to the first severity keyword. Now matches docs exactly.
5. **Idempotent verification:** re-running the generator produces a byte-identical `report.html`.

### Final counts (HTML report)

- 2 Critical, 11 Significant, 19 Moderate, 5 Low (37 active)
- 3 Withdrawn (F-0005, F-0031, F-0032)
- 40 total finding cards in the HTML
- 13 lens rows in scoreboard (1 folded, 1 preliminary, 11 complete)
- 59 page-data rows
- 15 recommendations grouped into 3 ROI tiers

### What does NOT update

- No source markdown was modified by the report generation; the report is a derived view, and the per-lens markdown reports remain canonical.
- No new findings; the report renders the existing finding set.
- No changes to plan file; Addendum 4 documents the work plan.

### Files added/changed in this pass

| Path | Status |
|---|---|
| `meta/audits/2026-05-18/report.html` | new (290 KB) |
| `meta/audits/2026-05-18/evidence/build-report.mjs` | new generator |
| `meta/audits/2026-05-18/README.md` | updated to point at `report.html` as the team-shareable front door |
| `meta/audits/2026-05-18/evidence/commands.log` | appended fifth-pass commands |
| `meta/audits/2026-05-18/evidence/amendments-expansion.md` | this addendum |

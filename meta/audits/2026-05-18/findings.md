# Findings — Audit 2026-05-18

**37 active findings** across the framework's **12 lenses** (Phase 8 was folded into Phase 13 as the procedural-accuracy sub-lens during the synthesis pass). 3 findings withdrawn. Grouped by severity; within each severity, ordered by lens (Phase 1 → 13). IDs are dense (`F-0001` through `F-0040`) — unique within this audit run only.

**Two amendment passes have happened:**
1. **Post-Node install** — see [evidence/amendments.md](evidence/amendments.md). Added F-0030/0031/0032, withdrew F-0005, downgraded F-0007 and F-0018.
2. **Expansion run (gh + Vale + Seven Action Model)** — see [evidence/amendments-expansion.md](evidence/amendments-expansion.md). Added F-0033 through F-0040, withdrew F-0031 and F-0032 (out of scope), confirmed F-0030 site-wide.

**Final counts:** 2 Critical · 11 Significant · 19 Moderate · 5 Low · 3 withdrawn.

Each finding follows the schema in [README.md](README.md#finding-schema). The bulleted entries below carry the full schema; the "Working notes" section after them holds the longer narrative captured per-phase during execution.

---

## Critical (2)

### F-0001 — Truncated `helm upgrade` command in self-hosting guide
- **Lens:** Phase 3 — Technical health
- **Page/entity:** `src/content/docs/docs/self-hosting/kubernetes-helm.mdx`
- **Remediation type:** Fix
- **Automation candidate:** Yes (markdown-aware linter for trailing line continuations in fenced bash blocks)
- See working note [W3-01](#w3-01--truncated-helm-upgrade-command-in-self-hosting-guide) for full evidence and rationale.

### F-0002 — Trust & safety: "what we send to which model when" is vague (AI-product deal-breaker)
- **Lens:** Phase 9 — Drift + Trust & Safety named checklist
- **Page/entity:** `security-and-privacy/promptless-subprocessors.mdx`, `security-and-privacy/data-handling-and-classification.mdx`
- **Remediation type:** Create / Improve
- **Automation candidate:** No (editorial / legal + security)
- See working note [W9-03](#w9-03--trust--safety-what-we-send-to-which-model-when-is-vague) for full evidence and rationale.

## Significant (12)

### F-0003 — Two real-content pages unreachable from the sidebar
- **Lens:** Phase 1 — Inventory
- **Page/entity:** `docs/configuring-promptless/context-sources/notion`, `docs/how-to-use-promptless/agent-knowledge-base`
- **Remediation type:** Fix (add to sidebar OR set `sidebar.hidden: true` if intentional)
- **Automation candidate:** Yes (CI check: every non-hidden mdx must appear in `sidebar.json`)
- See [W1-01](#w1-01--two-real-content-pages-are-unreachable-from-the-sidebar).

### F-0004 — 46 of 59 pages (78%) lack `description:` frontmatter
- **Lens:** Phase 1
- **Page/entity:** (global)
- **Remediation type:** Create (add descriptions; consider making schema-required)
- **Automation candidate:** Yes (content schema enforcement)
- See [W1-02](#w1-02--46-of-59-pages-78-lack-description-frontmatter).

### ~~F-0005 — 10 pages with images have ZERO alt-text coverage~~ — **WITHDRAWN**
- **Status:** Withdrawn in amendment pass (false positive from degraded regex parser).
- **AST verification:** all 24 image-containing pages have alt-ratio = 1.0 (every image has alt text). The regex parser was checking `<Frame>` for `alt=` attribute but `<Frame>` wraps `<img alt="...">` child elements.
- See [evidence/amendments.md](evidence/amendments.md) for details.

### F-0006 — Procedural accuracy is unmeasured: 0 of 17 documented procedures are tested (spec or inline)
- **Lens:** Phase 13 — procedural-accuracy sub-lens (formerly Phase 8; folded into Phase 13 in synthesis)
- **Page/entity:** (global) — 17 `<Steps>` procedures vs. 1 Doc Detective spec (`login.spec.json`, which tests the Clerk auth flow, not any documented procedure). **Zero inline Doc Detective markers** in any of the 59 MDX files (confirmed via `rg '\{\s*\*doc-detective\|<!--\s*doc-detective'`).
- **Why it matters:** The headline question for procedural accuracy isn't "how many tests exist" but "do the documented procedures yield the documented outcomes?" Today we cannot answer that for any of the 17 documented procedures because none have a test (inline or spec). This is a procedural-accuracy gap, not a coverage gap — and the gap means every documented procedure's accuracy is taken on faith.
- **Remediation type:** Create (write Doc Detective tests for top-N procedures, either inline in MDX bodies or as `.spec.json` files; doc-detective config already supports both).
- **Automation candidate:** Yes — Doc Detective CI workflow already exists (`.github/workflows/doc-detective.yml`); needs `pull_request` trigger and additional specs.
- **False-positive notes:** A procedure being untested doesn't mean it's broken — it means we have no procedural-accuracy evidence either way. The finding is about the evidence gap, not procedure-correctness.
- See [W3-03](#w3-03--doc-detective-covers-0-of-17-documented-steps-procedures--0-procedural-test-coverage).

### F-0007 — Audit environment lacked Node.js (**downgraded → Low** in amendment pass)
- **Lens:** Phase 3 (audit-infrastructure finding)
- **Page/entity:** (audit env)
- **Status:** Resolved for this run after `nvm install 24`. Tooling-spec S10 (containerize) still recommended to prevent recurrence.
- **Remediation type:** Spec-only — containerize the audit so the next executor can't hit this.
- **Automation candidate:** Yes (Dockerfile + preflight).
- See [W3-04](#w3-04--audit-environment-lacks-nodejs-buildtypechecksmokedoc-detective-could-not-run-locally).

### F-0008 — Docs surface essentially uninstrumented (1 of 59 pages)
- **Lens:** Phase 7
- **Page/entity:** (global)
- **Remediation type:** Create (8 named events per [metrics-report.md](metrics-report.md))
- **Automation candidate:** Yes (event catalog enforcement, CI checks for required events)
- See [W7-01](#w7-01--docs-surface-is-essentially-uninstrumented-1-of-59-pages-has-any-data-track-).

### F-0009 — Environment Variables reference missing
- **Lens:** Phase 9 — Reference completeness
- **Page/entity:** Need new `configuring-promptless/environment-variables-reference.mdx`
- **Remediation type:** Create
- **Automation candidate:** Partial
- See [W9-01](#w9-01--missing-environment-variables-reference-m3-in-drift-report).

### F-0010 — GitHub Release trigger claimed in welcome but no trigger doc exists
- **Lens:** Phase 9 — Coverage
- **Page/entity:** Welcome.mdx → missing `triggers/github-releases.mdx` (or fix welcome)
- **Remediation type:** Create (if implemented) / Fix welcome (if not)
- **Automation candidate:** Partial (welcome-claim ↔ trigger-page drift check)
- See [W9-02](#w9-02--missing-github-release-trigger-m1-in-drift-report).

### F-0011 — "First Success" moment not defined or orchestrated
- **Lens:** Phase 13 — Journey Stage 4
- **Page/entity:** Successor to quickstart is missing
- **Remediation type:** Create
- **Automation candidate:** Partial (quickstart-has-successor link check)
- See [W13-01](#w13-01--first-success-moment-is-not-defined-or-orchestrated).

### F-0012 — Decision support absent across ~8 axes of product choice
- **Lens:** Phase 13 — Decision support
- **Page/entity:** (global)
- **Remediation type:** Create (minimum: "Choosing a trigger" and "Hosted vs Self-hosted")
- **Automation candidate:** No (editorial)
- See [W13-02](#w13-02--decision-support-absent-across-8-axes-of-product-choice).

### F-0013 — Maintain/update lifecycle (Stage 8) absent
- **Lens:** Phase 13 + Phase 9 release/migration checklist
- **Page/entity:** Need versioning + deprecation + migration docs
- **Remediation type:** Create
- **Automation candidate:** Partial (link to changelog; deprecation drift)
- See [W13-03](#w13-03--maintainupdate-lifecycle-absent-stage-8-of-journey).

### F-0014 — Security reviewer hits two walls in T&S walkthrough (GDPR + per-call model transfer)
- **Lens:** Phase 13 — Trust & Safety walkthrough (journey manifestation of F-0002)
- **Page/entity:** Security-reviewer journey through `security-and-privacy/*`
- **Remediation type:** Improve — closing F-0002 closes most of this
- **Automation candidate:** No
- See [W13-06](#w13-06--security-reviewer-hits-two-walls-during-a-docs-walkthrough-gdpr--per-call-model-transfer-specifics).

### F-0030 — Footer H3 headings fail WCAG 2.1 AA color contrast (every page) — ADDED in amendment pass
- **Lens:** Phase 5 — Accessibility (now reachable with Node)
- **Page/entity:** Footer component — renders on every doc page; sampled via pa11y on `/docs/getting-started/welcome/`
- **Evidence:** pa11y JSON output: 3 `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail` errors — text contrast 2.54:1 vs. required 4.5:1 on `<h3>Product</h3>`, `<h3>Content</h3>`, `<h3>Company</h3>`. pa11y suggested fix: `#707783`.
- **Why it matters:** Affects every doc page (185 built HTML pages). WCAG 2.1 AA is the standard B2B accessibility commitment.
- **Confidence:** High.
- **Remediation type:** Fix.
- **Automation candidate:** Yes — pa11y-ci in CI on every PR (already specced as S5/S6 territory in tooling-spec).
- **False-positive notes:** None; canonical WCAG failure.
- See [evidence/amendments.md](evidence/amendments.md#f-0030--footer-h3-headings-fail-wcag-21-aa-color-contrast-every-page).

## Moderate (14)

### F-0015 — 4 empty stub pages persist (`core-concepts/*`, 82 days)
- **Lens:** Phase 1 (ROT)
- **Remediation type:** Decide (Create or Remove)
- See [W1-04](#w1-04--4-empty-stub-pages-persist-docscore-concepts).

### F-0016 — ~2700 words of meaningful hidden content (`pilot-overview`, `self-hosting/*`)
- **Lens:** Phase 1
- **Remediation type:** Decide (unhide-and-link, mark as draft, or document why)
- See [W1-05](#w1-05--substantial-hidden-pages-pilot-overview-1007-words-self-hosting-6431037-words).

### F-0017 — 21 visible pages have zero inbound docs links
- **Lens:** Phase 1 / findability
- **Remediation type:** Improve (cross-references where natural)
- See [W1-06](#w1-06--21-pages-have-zero-inbound-docs-links-excluding-hidden-rely-entirely-on-sidebar).

### F-0018 — 8 fenced code blocks have no language tag (**amended count**)
- **Lens:** Phase 3
- **Status:** Severity **downgraded Moderate → Low** in amendment pass; the actual count is 8 untagged blocks (not 45 — original regex over-counted by matching closing fences and indented fences).
- **AST + markdownlint MD040 both confirm: 8 errors.** Files: `customizing-notifications.mdx` (3), `api-triggers.mdx` (2), `git-hub-p-rs.mdx` (1), `slack-messages.mdx` (1), `github-enterprise-integration.mdx` (1).
- **Remediation type:** Improve (tag each block; most are HTTP shapes or pseudo-prompts).
- **Automation candidate:** Yes — markdownlint MD040 catches them exactly. Wire into CI.
- See [W3-02](#w3-02--45-of-74-fenced-code-blocks-have-no-language-tag) and [evidence/amendments.md](evidence/amendments.md).

### F-0019 — Event catalog explicitly excludes docs (titled "Marketing Event Glossary")
- **Lens:** Phase 7
- **Remediation type:** Create (Documentation Events section)
- See [W7-02](#w7-02--event-catalog-explicitly-excludes-docs-docsevents-md-titled-marketing-event-glossary).

### F-0020 — No feedback widget anywhere in the docs
- **Lens:** Phase 7
- **Remediation type:** Create
- **Automation candidate:** Yes (component + CI presence check)
- See [W7-03](#w7-03--no-feedback-widget-anywhere-in-the-docs).

### F-0021 — No `/llms.txt` and `/llms-full.txt` access tracking
- **Lens:** Phase 7
- **Remediation type:** Create (server-side log; agent-UA classifier)
- **Automation candidate:** Yes
- See [W7-04](#w7-04--no-llmstxt-and-llms-fulltxt-access-tracking).

### F-0022 — Beta lifecycle / graduation policy missing
- **Lens:** Phase 9 — Release/migration checklist
- **Remediation type:** Create
- **Automation candidate:** Partial (CI check that every `-beta` slug links to policy)
- See [W9-04](#w9-04--missing-beta-lifecycle--graduation-policy).

### F-0023 — Pricing/tier feature matrix missing in docs
- **Lens:** Phase 9 — Reference completeness
- **Remediation type:** Create
- See [W9-05](#w9-05--missing-pricing--tier-feature-matrix-in-docs).

### F-0024 — Docs-platform support (Mintlify/Fern/ReadMe/Docusaurus) named but no per-platform docs
- **Lens:** Phase 9
- **Remediation type:** Create (or simplify welcome claim)
- **Automation candidate:** Partial
- See [W9-06](#w9-06--naming-docs-platform-support-mintlifyfernreadmedocusaurus-named-in-welcome-but-no-per-platform-docs).

### F-0025 — Troubleshooting depth inverted: SaaS path thin, self-hosting strong
- **Lens:** Phase 13 — Stage 6
- **Remediation type:** Create (per-integration troubleshooting sections)
- **Automation candidate:** Partial (heading-presence check)
- See [W13-04](#w13-04--troubleshooting-depth-inverted-saas-path-thin-self-hosting-strong).

### F-0026 — Verification cues sparse (only 11 of 59 pages)
- **Lens:** Phase 13 — Task success
- **Remediation type:** Improve (add Verify step to every `<Steps>` block)
- **Automation candidate:** Yes (custom markdownlint rule)
- See [W13-05](#w13-05--verification-cues-sparse-across-procedural-pages-11-of-59-pages-have-any).

### F-0027 — Orphaned `agent-knowledge-base` cuts intermediate user gradient
- **Lens:** Phase 13 + Phase 1
- **Remediation type:** Fix (already in F-0003 root cause)
- See [W13-07](#w13-07--orphaned-agent-knowledge-base-cuts-the-intermediate-user-gradient).

### F-0028 — Pricing/tier gating creates unanswerable evaluation questions (Stage 2)
- **Lens:** Phase 13 — Evaluate
- **Remediation type:** Same as F-0023
- See [W13-08](#w13-08--pricingtier-feature-gating-creates-unanswerable-evaluation-questions-stage-2).

### ~~F-0031 — llms.txt covers only 96% of sitemap doc pages~~ — **WITHDRAWN (out of scope)**
- **Status:** Withdrawn in the expansion run after pulling the detail data via gh + AFDocs JSON. The 3 missing URLs are `/changelog/`, `/meet/`, `/use-cases/technical-writer-power-tool/` — none under `docs/`. For docs scope specifically, llms.txt coverage is **100%**.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md).

### ~~F-0032 — AFDocs warning: 4 of 50 sampled pages have markdown/HTML content parity drift~~ — **WITHDRAWN (out of scope)**
- **Status:** Withdrawn in the expansion run. AFDocs JSON detail shows the 3 affected pages (count was 3 not 4) are all under `/blog/*`, which is out of audit scope. For docs pages: 0 parity issues. The "diffs" were all blog "related posts" sidebar segments that don't render in markdown.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md).

---

## New findings from the expansion run (F-0033 through F-0040)

### F-0033 — Two singleton top-level sidebar groups
- **Lens:** Phase 2 — IA
- **Severity:** Moderate
- **Page/entity:** Account Management (1 leaf), Frequently Asked Questions (1 leaf)
- **Remediation:** Consolidate — fold into adjacent groups.
- See [`ia-report.md`](ia-report.md#sidebar-shape-metrics) and [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0033--two-singleton-top-level-sidebar-groups).

### F-0034 — Inconsistent beta-status convention (label vs slug)
- **Lens:** Phase 2 — IA / naming consistency
- **Severity:** Low
- **Page/entity:** 5 labels use "(Beta)" parenthetical; 3 slugs use `-beta` suffix; Microsoft Teams pages mix both
- **Remediation:** Improve — pair with F-0022 (beta lifecycle policy).
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0034--inconsistent-beta-status-convention-label-vs-slug).

### F-0035 — Vale baseline: 4235 alerts across 55/59 files (curation needed before enforcement)
- **Lens:** Phase 4 — Style & language
- **Severity:** Moderate (baseline only)
- **Page/entity:** (global)
- **Remediation:** Spec-only — curate dictionary + pick rules.
- See [`evidence/raw/vale.json`](evidence/raw/vale.json) and [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0035--vale-baseline-4235-alerts-1025-errors-across-5559-files-mostly-product-nouns).

### F-0036 — cspell finds one real misspelling: `compatibile` → `compatible`
- **Lens:** Phase 4 — Style & language
- **Severity:** Low
- **Page/entity:** `self-hosting/kubernetes-helm.mdx:45`
- **Remediation:** Fix.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0036--cspell-finds-one-real-misspelling-compatibile).

### F-0037 — 0 of 94 built docs HTML pages have JSON-LD structured data
- **Lens:** Phase 6 — Agent accessibility
- **Severity:** Moderate
- **Page/entity:** All built `dist/docs/*.html` pages
- **Remediation:** Create — inject `TechArticle` JSON-LD via Starlight `Head.astro` slot.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0037--0-of-94-built-docs-html-pages-carry-json-ld-structured-data).

### F-0038 — Ownership concentration: 61% of pages have `promptless[bot]` as last author
- **Lens:** Phase 10 — Ownership signal (risk indicator, not verdict)
- **Severity:** Moderate
- **Page/entity:** 36 of 59 pages
- **Remediation:** Spec-only — adopt the proposed ownership model in [`theater-report.md`](theater-report.md#proposed-ownership-model-deliverable-not-finding).
- **False-positive notes (critical):** Dogfooding is a positive signal; reviewer accountability is the real question, not last-author identity.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0038--ownership-concentration-61-of-pages-have-promptlessbot-as-last-author).

### F-0039 — 3 High-risk security pages overdue per proposed freshness cadence
- **Lens:** Phase 10 — Freshness (against proposed policy)
- **Severity:** Moderate
- **Page/entity:** privacy-policy, single-sign-on-sso-setup, self-hosting (all 82 days; cadence 60)
- **Remediation:** Adopt cadence policy + refresh these three.
- See [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0039--3-high-risk-security-pages-overdue-per-proposed-freshness-cadence-60-day-window).

### F-0040 — AI-style indicator cluster on 3 of 55 prose-heavy pages
- **Lens:** Phase 10 — AI-tells (risk indicators, not verdicts)
- **Severity:** Moderate
- **Page/entity:** `data-handling-and-classification` (skill verdict: moderate, 6 tells), `deep-analysis` (heuristic flag), `single-sign-on-sso-setup` (skill verdict: moderate, 6 tells)
- **Remediation:** Improve — review and tighten; the trailing boilerplate paragraph in data-handling line 78 is the highest-conviction single fix.
- **False-positive notes (critical):** Cluster verdict is "warrants review", NOT "is AI-generated". Security/compliance prose genuinely uses formal vocabulary.
- See [`evidence/raw/ai-tells/`](evidence/raw/ai-tells/), [`theater-report.md`](theater-report.md), and [evidence/amendments-expansion.md](evidence/amendments-expansion.md#f-0040--ai-style-indicator-cluster-on-3-of-55-prose-heavy-pages).

## Low (3)

### F-0007 — Audit environment lacked Node.js — see Significant section (downgraded)
Listed in Significant section above with status update; logged here only because the post-amendment severity is Low.

### F-0018 — 8 untagged fenced code blocks — see Moderate section (downgraded)
Listed in Moderate section above with the amendment; logged here only because the post-amendment severity is Low.

### F-0029 — External link reachability (now verified)
- **Lens:** Phase 3
- **Status:** Reachability **confirmed in amendment pass.** Node `fetch` over all 28 unique external URLs: 27 OK, 1 anti-bot 403 on `accounts.gopromptless.ai` (functional Clerk sign-up page; not broken).
- **Remediation type:** Spec-only — add lychee to CI on weekly cadence (tooling-spec S4).
- **Automation candidate:** Yes.
- See [W3-05](#w3-05--external-link-reachability-not-verified-28-unique-urls).

---

## Working notes (pre-synthesis)

Raw findings accumulate here as each lens runs. Phase 14 promotes them into the severity-sorted sections above with final IDs.

### Phase 1 — Inventory + ROT

#### W1-01 — Two real-content pages are unreachable from the sidebar
- **Lens:** Phase 1 (Inventory + ROT)
- **Severity:** Significant
- **Page/entity:** `docs/configuring-promptless/context-sources/notion` (536 words, 18d old, no description); `docs/how-to-use-promptless/agent-knowledge-base` (315 words, 9d old, has description)
- **Evidence:** Sidebar cross-check in `evidence/inventory.json` `sidebar_orphans_in_tree_not_nav` — both slugs present in tree, absent from `src/lib/generated/sidebar.json`. `sidebar.hidden: false` in both files' frontmatter — explicit intent that they not be hidden.
- **Source command:** `python3 meta/audits/2026-05-18/evidence/build-inventory.py`
- **Why it matters:** Real content is invisible to humans browsing the docs. The Notion context-source page in particular is part of the integrations promise; users connecting Notion as a context source need this. `agent-knowledge-base` is recent active work (9d) that someone clearly intends to ship.
- **Confidence:** High — sidebar.json is the authoritative nav source per `astro.config.mjs:64`.
- **Remediation type:** Fix (add to sidebar.json generation rules or, if hidden was intended, set `sidebar.hidden: true`).
- **Automation candidate:** Yes — CI check: every non-`hidden` MDX file under `src/content/docs/` must appear in `src/lib/generated/sidebar.json`.
- **False-positive notes:** Possible the generation script is intentionally excluding these slugs based on a rule we haven't traced (e.g., a `draft:` or `status: beta` filter). Need to inspect the sidebar-generation logic to confirm.

#### W1-02 — 46 of 59 pages (78%) lack `description:` frontmatter
- **Lens:** Phase 1
- **Severity:** Significant
- **Page/entity:** (global) — 46 pages; see `inventory.csv` filter `description_present=FALSE`.
- **Evidence:** Inventory count = 46/59; spot-checked frontmatter on `compliance-and-certifications.mdx` and `account-management.mdx` confirms absence.
- **Why it matters:** Affects SEO meta tags, sidebar tooltips, `/llms.txt` and `/llms-full.txt` agent comprehension (descriptions go into the index), and search snippets. Particularly impactful for an AI documentation product whose own llms.txt is the way other agents discover them.
- **Confidence:** High.
- **Remediation type:** Create (add descriptions; possibly batch-author from H1 + first paragraph as a starting point).
- **Automation candidate:** Yes — content schema (`src/content.config.ts`) can mark `description` as required, breaking the build on missing. Or a softer CI lint that warns. Pair with a script that suggests a description from the first prose paragraph.
- **False-positive notes:** Some pages may have descriptions inferred from H1 + first ¶ by Starlight; this still wouldn't help llms.txt which reads frontmatter directly.

#### W1-03 — 10 pages with images have incomplete alt-text; 10 of those have ZERO alt coverage
- **Lens:** Phase 1 (accessibility signal; full WCAG audit is Phase 5, not run this round)
- **Severity:** Significant
- **Page/entity:** 10 pages with `image_alt_present_ratio = 0.0` including `account-management`, four `configuring-promptless/triggers/*` pages, `slack-messages`, `agent-knowledge-base`, `deep-analysis`, `managing-environment-variables`, `git-hub-repos-docs-as-code`, jira and linear context-source pages.
- **Evidence:** `inventory.csv` column `image_alt_present_ratio`; degraded-parser detection of `![]()`, `<Frame>`, `<Image>` without `alt=`.
- **Why it matters:** WCAG 2.1 AA requires alt text on non-decorative images. Promptless is a B2B SaaS where many users have accessibility-procurement requirements; image-heavy how-to pages (which is most of these) are exactly where screen-reader users need alt text most.
- **Confidence:** Medium — degraded parser may miss some legitimate alt patterns (e.g., alt set via prop spread). Manually spot-check `<Frame alt="...">` usage.
- **Remediation type:** Fix (add alt text per image) + Spec-only (CI check on alt-text presence).
- **Automation candidate:** Yes — alt-text linter on MDX images. Doable without node via shell, ideal with `remark-lint-no-empty-image-alt`.
- **False-positive notes:** Some screenshots are explicitly decorative (`alt=""` is correct) and not yet differentiated from "missing alt".

#### W1-04 — 4 empty stub pages persist (`docs/core-concepts/*`)
- **Lens:** Phase 1 (ROT signal)
- **Severity:** Moderate
- **Page/entity:** `docs/core-concepts`, `docs/core-concepts/{context-sources,doc-locations,triggers}` — all 0 words, 82 days old, hidden in sidebar.
- **Evidence:** `inventory.csv` `word_count=0` rows; all 4 are `sidebar.hidden=TRUE`.
- **Why it matters:** Documentation Theater risk (per Phase 9 framework): pages that exist as placeholders for 82+ days suggest either abandoned planning or a structural choice that should be documented. `core-concepts/triggers` has a lowercase title which is a small but visible quality signal.
- **Confidence:** High on the facts; Low on intent.
- **Remediation type:** Decide (Create the content OR Remove the stubs). Probably should be a question to the docs owner: are these planned or vestigial?
- **Automation candidate:** Partial — CI can flag empty MDX files; the decide-or-act step is human.
- **False-positive notes:** These could be intentional URL placeholders pending a planned content effort. The 82-day age makes that less likely.

#### W1-05 — Substantial hidden pages: `pilot-overview` (1007 words), `self-hosting/*` (643+1037 words)
- **Lens:** Phase 1
- **Severity:** Moderate
- **Page/entity:** `docs/getting-started/pilot-overview` (1007w, 14d, hidden); `docs/self-hosting` (643w, 82d, hidden); `docs/self-hosting/kubernetes-helm` (1037w, 18d, hidden).
- **Evidence:** Inventory; `sidebar.hidden=TRUE` for all three.
- **Why it matters:** ~2700 words of meaningful, recently-touched content sit invisible to docs browsers. Self-hosting in particular is a category that buyers explicitly ask for; hiding the only kubernetes-helm page may be intentional (private beta) but should be confirmed.
- **Confidence:** High on facts, Low on intent.
- **Remediation type:** Decide (Unhide and link, OR document why hidden, OR mark as draft/internal).
- **Automation candidate:** Partial — CI can flag `hidden=true` + `word_count > 100` + `age > 30 days` (likely-shippable hidden content) but the call is human.
- **False-positive notes:** `pilot-overview` may be a sales-only artifact reached from external links; `self-hosting` may be enterprise-only on purpose.

#### W1-06 — 21 pages have zero inbound docs links (excluding hidden); rely entirely on sidebar
- **Lens:** Phase 1 (findability signal; full IA is Phase 2, not run)
- **Severity:** Moderate
- **Page/entity:** (global) — includes `docs/getting-started/welcome`, `docs/getting-started/promptless-1-0`, `docs/getting-started/promptless-oss`, `docs/getting-started/getting-help`, several how-to pages and trigger configs.
- **Evidence:** `inventory.csv` `inbound_link_count=0` filter.
- **Why it matters:** No cross-page reinforcement makes these pages discoverable only via nav. If a user lands directly (e.g., from an external link to a how-to), there's no "see also" reinforcement to keep them in the docs. Particularly notable for the welcome and getting-started pages, which are highest-value entry points.
- **Confidence:** Medium — the degraded link counter may undercount link types it doesn't recognize (e.g., MDX `<a href="">`, props-passed routes).
- **Remediation type:** Improve (add cross-references where natural; encourage `See also` patterns).
- **Automation candidate:** Partial — link density is measurable, but where to add links is editorial judgment.
- **False-positive notes:** Sidebar reach is sufficient for many cases; not every page needs inbound links. Significant only for high-traffic or onboarding pages.

### Phase 3 — Technical health

#### W3-01 — Truncated `helm upgrade` command in self-hosting guide
- **Lens:** Phase 3 (Technical health — code sample correctness)
- **Severity:** **Critical**
- **Page/entity:** `src/content/docs/docs/self-hosting/kubernetes-helm.mdx`, second bash block (around the "Upgrade to latest version" section)
- **Evidence:** Command block ends with `helm upgrade promptless promptless/server \\\n  --namespace promptless \\\n` (the backslash line continuation has no following line). A user pasting this gets a shell that hangs waiting for more input or an incomplete command that omits all flag values.
- **Source command:** `sed -n '/^\`\`\`bash$/,/^\`\`\`$/p' src/content/docs/docs/self-hosting/kubernetes-helm.mdx`
- **Why it matters:** Self-hosting users are operations engineers who copy-paste these commands. An incomplete `helm upgrade` either errors out or, worse, applies a partial upgrade (depending on shell handling of trailing `\`). This is the kind of defect that causes a customer-affecting incident on the user's cluster.
- **Confidence:** High — directly observable in the file.
- **Remediation type:** Fix (complete the command with the correct arguments — likely `--version <vN.N.N>` and any `--values <file.yaml>` the upgrade requires).
- **Automation candidate:** Yes — a markdown-aware linter that flags trailing line continuations inside fenced bash blocks; or shellcheck integration once node is available.
- **False-positive notes:** Could be intentional if the author wanted to show the *pattern* without specific arguments, but in that case the snippet should end with `<your-args>` or be in a non-bash text block. As-is, the line continuation is misleading.

#### W3-02 — 45 of 74 fenced code blocks have no language tag
- **Lens:** Phase 3
- **Severity:** Moderate
- **Page/entity:** (global) — biggest offenders: `customizing-notifications.mdx` (6 untagged blocks), `api-triggers.mdx` (5 untagged), several others
- **Evidence:** `rg -t md '^\`\`\`' src/content/docs/docs/ --no-filename | sed 's/^\`\`\`//' | sort | uniq -c` returns: 45 blank, 24 `txt wordWrap`, 2 `json`, 2 `bash`, 1 `markdown`
- **Why it matters:** Untagged blocks miss syntax highlighting, search indexing for code, and any code-sample linting we'd ever want to add. Many of the untagged blocks are HTTP-shaped (`POST /triggers`, `Authorization: Bearer ...`) and should be tagged `http` or `text`; others are prompt-shaped natural-language instructions to Promptless and should be `txt wordWrap` for consistency with the rest of the prompt-block convention already used in `working-with-slack.mdx` and `interacting-with-promptless-p-rs.mdx`.
- **Confidence:** High.
- **Remediation type:** Improve (label every fenced block).
- **Automation candidate:** Yes — markdownlint rule `MD040 fenced-code-language` would catch all 45 in CI.
- **False-positive notes:** Some blocks may be intentionally unlabeled (e.g., free-form output illustrations); those should be tagged `text` rather than left blank to make intent explicit.

#### W3-03 — Doc Detective covers 0 of 17 documented `<Steps>` procedures (~0% procedural test coverage)
- **Lens:** Phase 13 — procedural-accuracy sub-lens (formerly Phase 8 — folded into Phase 13 in the synthesis pass; the headline question is procedural accuracy, not test-file count)
- **Severity:** Significant
- **Page/entity:** (global) — 17 `<Steps>` blocks across ~10 pages, top: `working-with-slack` (4), `pilot-overview` (2), `kubernetes-helm` (2), `atlassian-integration` (2), `using-promptless-capture` (2). The only Doc Detective spec is `clerk-login` (a precondition test, not a procedure verification).
- **Evidence:** `rg -c '<Steps\\b' src/content/docs/docs/`; `ls .doc-detective/tests/` returns one file (`login.spec.json`).
- **Why it matters:** Promptless ships docs-as-code automation as its core product. The docs themselves having 17 documented procedures and 0 verified procedures undermines the product's premise. Even modest Doc Detective coverage on the top 3 procedures (Slack interaction, GitHub integration setup, install/auth) would demonstrate the product's dogfooding story.
- **Confidence:** High.
- **Remediation type:** Create (Doc Detective specs for top-N procedures).
- **Automation candidate:** Yes — a CI check that counts `<Steps>` per page and compares to spec count produces a coverage metric.
- **False-positive notes:** Not every `<Steps>` block is a procedure that *can* be tested (some need real auth, real Slack/GitHub workspaces). A coverage target of 100% is wrong; a 30–50% target for the highest-traffic procedures is realistic.

#### W3-04 — Audit environment lacks Node.js; build/typecheck/smoke/Doc-Detective could not run locally
- **Lens:** Phase 3 (tooling health — affects audit infrastructure, not production)
- **Severity:** Significant
- **Page/entity:** (audit environment, not docs content)
- **Evidence:** `node --version` returns "command not found"; no nvm/asdf/mise/fnm/volta; `node_modules/` does not exist. Tooling captured in `evidence/tool-versions.txt`. CI workflow `.github/workflows/check.yml` uses Node 20 and is presumably green in GitHub Actions (no inspection available without `gh`).
- **Why it matters:** This audit cannot independently verify: build success, smoke-test pass, AST-based MDX parsing, lychee link reachability, Vale/markdownlint/alex/cspell results, pa11y-ci accessibility, Doc Detective execution. The audit *infrastructure* requires a node-enabled environment to deliver its automated lenses. Findings derived from the degraded parser are tagged `evidence: degraded-parser` and the link findings as `evidence: not-reachability-tested`.
- **Confidence:** High.
- **Remediation type:** Spec-only — the audit *recipe* should mandate a node-enabled execution environment (or container) as a preflight check.
- **Automation candidate:** Yes (in the tooling-spec): containerize the audit (a Dockerfile that pins node + all 8 audit tools) so future runs cannot start without them.
- **False-positive notes:** This is an artifact of this audit run, not a production concern — CI clearly runs `check.yml` with node 20 successfully on PRs to main.

### Phase 7 — Docs usage metrics & instrumentation

#### W7-01 — Docs surface is essentially uninstrumented (1 of 59 pages has any `data-track-*`)
- **Lens:** Phase 7
- **Severity:** Significant — meets the qualified rule: high-value pages, stated measurement goal (PostHog exists, `analytics.md` documents an event catalog), no way to measure docs success today.
- **Page/entity:** (global) — 1 of 59 docs pages (`welcome.mdx`) has a `data-track-*` attribute, and it's a Book-Demo CTA (conversion event), not a docs-success event. Marketing surface by comparison has 23+ call sites in `src/components/site/*` alone.
- **Evidence:** `evidence/instrumentation.csv`; raw counts via `rg 'data-track-' src/content/docs/ -c` returns one match.
- **Source command:** `rg --type-add 'astro:*.astro' --type-add 'mdx:*.mdx' --type astro --type mdx --type ts 'data-track-(action|funnel|location|campaign)' src/`
- **Why it matters:** No way to measure which docs pages complete user tasks, which searches fail, which examples are copied, whether agents are fetching `/llms.txt`, or whether users find a page helpful. The product's own quarterly-improvement story is hard to substantiate without this data.
- **Confidence:** High.
- **Remediation type:** Create — add the 8 events specified in `metrics-report.md` (page view with structured props, helpful vote, code copy, search, external link, integration CTA, llms.txt access, step completion). Sequenced by ROI.
- **Automation candidate:** Yes — the events themselves are tooling; once specced, CI can enforce that every quickstart, integration, and how-to page emits the `docs_page_viewed` event with required props.
- **False-positive notes:** PostHog autocapture may already fire generic events on docs pages without explicit `data-track-*` attributes. Confirming this requires dashboard access, which was not available this run. Even so, autocapture events without structured docs-context properties (slug, section, page_type) cannot answer the questions in `metrics-report.md`.

#### W7-02 — Event catalog explicitly excludes docs (`docs/events.md` titled "Marketing Event Glossary")
- **Lens:** Phase 7
- **Severity:** Moderate
- **Page/entity:** `docs/events.md`, `docs/analytics.md`
- **Evidence:** `docs/events.md:1` header reads "# Marketing Event Glossary"; all 10 documented events are marketing/conversion; `docs/analytics.md`'s "Known Issues" section lists 5 issues, none about docs instrumentation.
- **Why it matters:** The team's own analytics documentation has accurately scoped itself out of the docs surface. Closing the instrumentation gap (W7-01) also requires extending the catalog to docs — otherwise new events will be inconsistently named and untracked in the documented glossary.
- **Confidence:** High.
- **Remediation type:** Create — extend the catalog with a "Documentation Events" section. Specify the 8 events from `metrics-report.md` with shape, required props, when-to-fire, and example consumers.
- **Automation candidate:** Partial — the catalog can be machine-checked (every event named in code must exist in the catalog; every event in the catalog must have at least one emit site), but the *initial drafting* is editorial.

#### W7-03 — No feedback widget anywhere in the docs
- **Lens:** Phase 7
- **Severity:** Moderate
- **Page/entity:** (global)
- **Evidence:** No component matching `helpful`, `feedback`, `vote`, `thumb` in `src/components/` (rg confirmed); no event in events.md catalog; no `<Footer>` slot or layout-level inclusion of any feedback prompt.
- **Why it matters:** This is the cheapest, highest-signal docs metric. Three weeks of thumbs-up/down data tells you which pages are bleeding users and which are loved. Especially valuable on quickstart, integrations, and troubleshooting pages.
- **Confidence:** High.
- **Remediation type:** Create — a 30-line Astro component (or PostHog Feedback Widget) wired into the Starlight page-level template.
- **Automation candidate:** Yes — both the component and a CI check that ensures it's present on every major doc.
- **False-positive notes:** Some teams deliberately omit feedback widgets to avoid noise. If that's a stated stance, change finding type to Spec-only and surface in the ownership-model section.

### Phase 9 — Drift / Gap + named checklists

See [drift-report.md](drift-report.md) for the full system-graph vs doc-graph analysis. Per-finding entries here capture the top-severity items that bubble to `findings.md`.

#### W9-01 — Missing: Environment Variables reference (M3 in drift-report)
- **Lens:** Phase 9 (Reference completeness)
- **Severity:** Significant
- **Page/entity:** `docs/how-to-use-promptless/managing-environment-variables` is procedural ("how to add a var"). No reference page lists supported/standard env vars.
- **Evidence:** The doc gives one example (`TEST_ACCOUNT_URL`). Welcome-implied features (Capture, integrations) require many more variables. No reference table anywhere in `src/content/docs/docs/`.
- **Why it matters:** Users setting up Promptless Capture or any feature dependent on env vars have to discover variable names by trial and error — or by reading screenshots in the same doc. Standard developer-product expectation is a reference table.
- **Confidence:** High.
- **Remediation type:** Create.
- **Automation candidate:** Partial — listing the supported variables requires product-side knowledge; a CI check could enforce that any env var named anywhere in the docs appears in the reference table.
- **False-positive notes:** Possible Promptless intentionally allows arbitrary variable names (every var is user-defined for their own use). If so, the gap is documentation of *patterns* rather than enumeration.

#### W9-02 — Missing: GitHub Release trigger (M1 in drift-report)
- **Lens:** Phase 9 (Reference completeness; coverage)
- **Severity:** Significant
- **Page/entity:** No `triggers/github-releases.mdx`.
- **Evidence:** [welcome.mdx](../../../src/content/docs/docs/getting-started/welcome.mdx) lists "pull requests, commits, or releases change behavior that customers need to understand." The first two have triggers (`git-hub-prs`, `git-hub-commits`). The third is absent.
- **Why it matters:** Release-based triggers are the cleanest mapping to release notes / changelog updates, which the product explicitly markets as a use case. Users reading welcome.mdx will look for this, find nothing, and ask support.
- **Confidence:** High — the welcome page's wording is unambiguous.
- **Remediation type:** Create (if the trigger exists in the product) OR Fix the welcome page (if it doesn't).
- **Automation candidate:** Partial — drift check between welcome-page claims and trigger pages can be automated.
- **False-positive notes:** Welcome may be aspirational marketing copy; the trigger may not be implemented yet.

#### W9-03 — Trust & safety: "what we send to which model when" is vague
- **Lens:** Phase 9 (Trust & Safety named checklist)
- **Severity:** **Critical** — per the severity rubric: "missing trust-and-safety content that a security reviewer would consider a deal-breaker" applies because the product handles **customer code** transferred to **external model providers**.
- **Page/entity:** `security-and-privacy/promptless-subprocessors.mdx`, `security-and-privacy/data-handling-and-classification.mdx`
- **Evidence:** `data-handling-and-classification.mdx` says GitHub PR triggers "analyze the changes in real-time without storing the PR content" and that "Promptless does not use customer data for pre-training or fine-tuning". But the subprocessors page is "model-agnostic" rather than specifying: per-request, what data leaves your perimeter; which model provider receives it; with what retention contract; to which region; with what data-processing addendum. Security reviewers ask exactly this.
- **Why it matters:** Promptless is selling into engineering organizations whose security teams will block adoption without crisp answers. The current docs say enough to be reassuring at a glance but won't survive a careful security review.
- **Confidence:** High on the gap; the *severity* qualifier requires the product to actually handle customer code (it does, by design) and external-model transfer (yes, multi-provider model-agnostic).
- **Remediation type:** Create / Improve — a "Data shared with model providers" page with per-trigger-type tables: "When a GitHub PR triggers Promptless, the following data is sent to <providers> with <retention> at <region>".
- **Automation candidate:** No — this is editorial / legal/security review work.
- **False-positive notes:** If the actual provider contracts ARE strict (zero-retention, regional, etc.), then the gap is communication, not policy. Either way, the writeup is the remediation.

#### W9-04 — Missing: Beta lifecycle / graduation policy
- **Lens:** Phase 9 (Release / migration / deprecation named checklist)
- **Severity:** Moderate
- **Page/entity:** (global) — 3 slugs use `-beta` suffix: `intercom-tickets-beta`, `intercom-integration-beta`, `launchdarkly-integration-beta`. No policy doc.
- **Evidence:** [drift-report.md](drift-report.md#M4); slug listing from inventory.
- **Why it matters:** Beta features carry implicit risk for users. Without a policy ("Beta features have <SLA>, <change-without-notice>, <graduation criteria>"), users can't make informed adoption decisions, and the docs accumulate `-beta` cruft that's hard to clean up.
- **Confidence:** High.
- **Remediation type:** Create a small policy page; cross-link from every `-beta` doc.
- **Automation candidate:** Partial — a CI check that every `-beta` slug has a "Status: Beta" callout linking to the policy.

#### W9-05 — Missing: Pricing / tier feature matrix in docs
- **Lens:** Phase 9 (Reference completeness)
- **Severity:** Moderate
- **Page/entity:** (global) — 10 docs pages reference pricing tiers ("Enterprise plan"), no feature matrix
- **Evidence:** `rg -l -i 'enterprise|professional' src/content/docs/docs/` returns 10 hits; spot-checked compliance, account-management, self-hosting — all gate features behind "Enterprise plan" but no comprehensive matrix
- **Why it matters:** Feature gating is a frequent buyer question. Without a single matrix, users have to skim 10 different pages to figure out what they get on their tier. This also affects sales conversations.
- **Confidence:** High.
- **Remediation type:** Create or link — even a single linked page from the marketing `/pricing` showing tier-by-tier feature parity would close the gap.
- **Automation candidate:** Partial — CI can flag tier mentions without a matrix link.

### Phase 13 — Journey & task success

#### W13-01 — "First Success" moment is not defined or orchestrated
- **Lens:** Phase 13 (Journey stage 4)
- **Severity:** Significant
- **Page/entity:** Gap across `getting-started/setup-quickstart.mdx` → no successor page in the onboarding gradient
- **Evidence:** Quickstart ends at "Start trial" (step 6 of the guided wizard). There is no page that articulates "Promptless has produced its first suggestion / opened its first PR — you are now in business." No "Within X minutes / hours of completing setup, expect Y" promise. See [journey-report.md](journey-report.md#onboarding-gradient).
- **Why it matters:** First-success orchestration is the difference between a trial that converts and one that stalls. Users complete setup and then face an undefined "now what" — they wait for Promptless to do something rather than knowing what *should* happen and when. For a product that depends on triggers, the gap between configuration and first observed value is the single highest-leverage onboarding step.
- **Confidence:** High (presence/absence check); Low on the *quantitative impact* without funnel data (Phase 7 instrumentation gaps mean we can't see drop-off).
- **Remediation type:** Create — a `getting-started/your-first-suggestion.mdx` page that explicitly says: "After completing setup, here is the expected sequence of events; here is how to confirm Promptless is working; here is what to do if nothing happens within X."
- **Automation candidate:** Partial — the page is human-written; CI can enforce that quickstart links to a successor page.
- **False-positive notes:** Some products deliberately leave first-success open-ended (especially when value depends on the customer's real workflow). For Promptless, the trigger-based model means there's a deterministic first event to point to.

#### W13-02 — Decision support absent across ~8 axes of product choice
- **Lens:** Phase 13 (Decision support)
- **Severity:** Significant
- **Page/entity:** (global) — no decision-support pages exist for: trigger-type choice, hosted vs self-hosted, context-source choice, manual vs automatic workflows, beta vs GA, docs-platform choice, OSS vs Cloud
- **Evidence:** [journey-report.md](journey-report.md#decision-support) catalogs 8 axes; none has a "when to use X vs Y" page.
- **Why it matters:** Each missing decision page is a support ticket waiting to happen. For an integration-heavy product (8 triggers × 4 context sources × 9 integrations), users facing combinatorial choice with no guidance default to either the first option they see or to support.
- **Confidence:** High.
- **Remediation type:** Create — at minimum: "Choosing a trigger" and "Hosted vs Self-hosted" pages. These are not large docs — each can be a 200-300-word decision tree.
- **Automation candidate:** No — pure editorial.
- **False-positive notes:** Some products avoid decision-pages in favor of conversational sales/onboarding. If that's the stance, the gap is acceptable but should be a deliberate stance, not an accident.

#### W13-03 — Maintain/update lifecycle absent (Stage 8 of journey)
- **Lens:** Phase 13 + Phase 9 (Release/migration/deprecation named checklist)
- **Severity:** Significant
- **Page/entity:** No versioning model documented; no deprecation page; no migration guide. `promptless-1-0.mdx` is a launch announcement, not a maintain-and-upgrade page.
- **Evidence:** `rg -l 'migration|deprecat|breaking change|release notes'` across docs returns only `intercom-integration-beta.mdx` (in-page beta callout) and `microsoft-teams-integration.mdx` (similar). No top-level lifecycle content.
- **Why it matters:** As Promptless evolves (and it clearly is — Intercom/LaunchDarkly/Teams pages have `-beta` suffixes that suggest active version churn), users need a deliberate channel for "what's changing, what's deprecated, what's safe to depend on." Without it, every breaking change becomes a surprise.
- **Confidence:** High.
- **Remediation type:** Create — `getting-started/versioning-and-lifecycle.mdx` (or similar), plus link from welcome.
- **Automation candidate:** Partial — once the page exists, CI can enforce that breaking changes in code reference a deprecation entry.
- **False-positive notes:** The changelog in `src/content/changelog/` (out of audit scope) likely carries some of this content; if so, the gap is *linkage* and *summary*, not creation.

#### W13-04 — Troubleshooting depth inverted: SaaS path thin, self-hosting strong
- **Lens:** Phase 13 (Stage 6, Troubleshooting & recovery)
- **Severity:** Moderate
- **Page/entity:** (pattern across the docs) — `self-hosting/kubernetes-helm.mdx` has the strongest troubleshooting depth (9 verification cues, AccordionGroup with common issues); SaaS user pages have far thinner coverage. See troubleshooting matrix in [journey-report.md](journey-report.md#troubleshooting--recovery-coverage-matrix).
- **Evidence:** Matrix of 8 features × troubleshooting depth; the SaaS-side features (Capture, doc collections, context sources) have no dedicated troubleshooting sections.
- **Why it matters:** Most users are on the SaaS path. They will hit edges (Capture auth failure, Confluence scope mismatch, Slack workspace permissions) and the docs offer no recovery path. Pattern mirrors a common ops-vs-product team imbalance.
- **Confidence:** Medium — the absence of explicit troubleshooting sections is verifiable; whether users *actually* hit these issues isn't, since no support data was accessible this run.
- **Remediation type:** Create — at minimum a "Troubleshooting" section per integration page, addressing the 3 most-likely failure modes.
- **Automation candidate:** Partial — CI can enforce that each how-to/integration page contains a troubleshooting heading; the content is editorial.
- **False-positive notes:** Some failure modes may be self-evident from product error messages (which might be excellent for all we know). Without dashboard / support data, the audit can't tell whether these gaps are felt by users.

#### W13-05 — Verification cues sparse across procedural pages (11 of 59 pages have any)
- **Lens:** Phase 13 (task success criteria)
- **Severity:** Moderate
- **Page/entity:** (global) — only 11/59 pages contain phrases like "verify", "confirm that", "you should see"
- **Evidence:** `rg -i 'verify|confirm that|you should see|you will see' -c` returns 11 files; top hitter `kubernetes-helm` has 9; most have 1.
- **Why it matters:** Users walking a how-to have no closing checkpoint. "Save your changes" ends most procedures, but "save" is not equivalent to "Promptless is now configured correctly". Verification language is the difference between procedural docs and tested-procedure docs.
- **Confidence:** Medium — degraded parser may miss verification language phrased outside these patterns.
- **Remediation type:** Improve — add a "Verify" or "Confirm" step at the end of every `<Steps>` block. Standard documentation pattern.
- **Automation candidate:** Yes — markdownlint custom rule or content-schema enforcement that every `<Steps>` block ends with a step whose verb is in {Verify, Confirm, Check, See}.
- **False-positive notes:** Some procedures (e.g., declarative config changes) genuinely have no verification step. The check should be advisory, not blocking.

#### W13-06 — Security reviewer hits two walls during a docs walkthrough (GDPR + per-call model transfer specifics)
- **Lens:** Phase 13 (Trust & Safety walkthrough)
- **Severity:** Significant (would be Critical if combined with W9-03; tracked here as the *journey* manifestation of the same root cause)
- **Page/entity:** Security-reviewer persona walking `security-and-privacy/*`
- **Evidence:** [journey-report.md trust-and-safety walkthrough](journey-report.md#trust--safety-walkthrough--security-reviewer-persona-simulation): ~60% of the typical security-review checklist is answered in docs; GDPR and per-call model transfer specifics are walls.
- **Why it matters:** Two walls is the point at which a security reviewer switches from "reading docs" to "filing a security questionnaire to sales" — friction-inducing for the buyer and labor-intensive for Promptless. Closing W9-03 also closes most of this finding.
- **Confidence:** Medium (no real security-reviewer feedback this run; based on standard B2B SaaS security review checklists).
- **Remediation type:** Improve — see W9-03.
- **Automation candidate:** No.
- **False-positive notes:** A real security reviewer might not care about these specifically; depends on the buyer's compliance posture (GDPR matters for EU customers, model-specifics for security-sensitive customers).

#### W13-07 — Orphaned `agent-knowledge-base` cuts the intermediate user gradient
- **Lens:** Phase 13 (onboarding gradient) + Phase 1 (W1-01)
- **Severity:** Moderate
- **Page/entity:** `docs/how-to-use-promptless/agent-knowledge-base` (315 words, 9 days old, has description, sidebar.hidden=false but NOT in sidebar.json)
- **Evidence:** Already documented in W1-01. Here it's important as a *gradient finding*: the page is exactly the right shape for intermediate users moving from basic use to mastery, and they can't reach it.
- **Why it matters:** Users who finished quickstart and are trying to grow their use of Promptless will look for "configure Promptless to know X about my product." That's this page. Hiding it from nav cuts the gradient at the worst possible step.
- **Confidence:** High.
- **Remediation type:** Fix (add to sidebar) OR explicitly hide and explain.
- **Automation candidate:** Yes (same CI check as W1-01).

#### W13-08 — Pricing/tier feature gating creates unanswerable evaluation questions (Stage 2)
- **Lens:** Phase 13 (Evaluate)
- **Severity:** Moderate
- **Page/entity:** Same set as W9-05 — 10 pages gate features behind "Enterprise plan" without a comprehensive matrix
- **Evidence:** Already documented in W9-05; here it's the journey-stage manifestation
- **Why it matters:** A prospect in Stage 2 (Evaluate) cannot tell what they get on which tier. They have to read 10 different pages and synthesize. Combined with the hidden self-hosting and pilot-overview pages, the evaluate stage actively hides information from buyers.
- **Confidence:** High.
- **Remediation type:** Same as W9-05.


- **Lens:** Phase 9 (Coverage)
- **Severity:** Moderate
- **Page/entity:** Welcome mentions 4 platforms; none has a doc.
- **Evidence:** welcome.mdx body — "Open documentation pull requests for docs-as-code platforms like Mintlify, Fern, ReadMe, Docusaurus, and more". `/integrations/` has no platform-specific pages.
- **Why it matters:** Users on a specific docs platform will look for platform-notes (Mintlify-specific patterns, Fern-specific frontmatter, etc.). The catch-all "GitHub repos as docs-as-code" page covers the mechanics but not platform-specific quirks.
- **Confidence:** High.
- **Remediation type:** Create (per-platform notes), or simplify the welcome claim to avoid raising the expectation.
- **Automation candidate:** Partial — could automate "if welcome names a platform, a page must exist".


- **Lens:** Phase 7
- **Severity:** Moderate — specific to the AI-product use case
- **Page/entity:** `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- **Evidence:** Both files are dynamic Astro routes that generate their content from the content collection but do not emit any access event or log line. AFDocs CI scores the content quality daily; nothing measures consumption.
- **Why it matters:** For an AI documentation automation product, agent traffic to `/llms.txt` and `/llms-full.txt` *is* a key product signal. If competitor agents are fetching it daily, that's leverage. If nobody's fetching it, that's a different signal. Without logging, the team is blind.
- **Confidence:** High.
- **Remediation type:** Create — server-side log line with `{ ua, ip_hash, route, ts }`; aggregate weekly; classify known agent UAs (GPTBot, ClaudeBot, Bingbot, PerplexityBot, etc.).
- **Automation candidate:** Yes — adding 5 lines to both files is straightforward; aggregation can be a small Vercel function or PostHog event.
- **False-positive notes:** PostHog may already be tracking these requests via autocapture; if so, this finding downgrades to "untag the events". Confirm with dashboard access.


- **Lens:** Phase 3
- **Severity:** Low (this run; would be Moderate–Significant if a high-rate of breakage were detected)
- **Page/entity:** (global) — 28 unique external URLs across docs
- **Evidence:** External link extraction in `/tmp/audit-external-links.txt`. Top hosts: `app.gopromptless.ai` (8), `github.com` (3), `docs.github.com` (2), plus a long tail of vendor docs (`docs.vellum.ai`, `docs.runpod.io`, `docs.temporal.io`, etc.).
- **Why it matters:** External docs links (vendor doc sites, Doc Detective docs, GitHub docs) are the most likely to rot. This audit can't tell what's currently broken.
- **Confidence:** Low (because reachability is unmeasured); the *fact* that links exist is High.
- **Remediation type:** Spec-only — add lychee to CI on a weekly cadence with the link list extracted from MDX.
- **Automation candidate:** Yes — `lychee` is the canonical tool; runs as a GH action with config for ignored URLs and rate-limit handling.
- **False-positive notes:** Phase 3 link-format checks (https-only, no whitespace, no malformed) all pass; the 28 URLs are at least *well-formed*.


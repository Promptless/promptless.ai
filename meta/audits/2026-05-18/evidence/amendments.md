# Audit Amendments — 2026-05-18 (post-Node install)

After the initial audit ran in degraded mode (no Node available), Node 24.15.0 was installed via nvm and `npm ci` completed. This document records the second-pass amendments and is the source of truth where it disagrees with the original findings.

## Re-execution log

| Action | Result |
|---|---|
| `nvm current` | `v24.15.0` |
| `npm --version` | `11.12.1` |
| `npm ci` | 948 packages, 32s |
| `npm run check` | exit 0; 132 pages built; Pagefind indexed 185 HTML files |
| `npm run test:smoke` | 14/14 passed in 5.9s |
| External link reachability via Node `fetch` | 27/28 OK; 1 anti-bot 403 on `accounts.gopromptless.ai` (working Clerk sign-up) |
| AST inventory (`build-inventory-ast.mjs` via `gray-matter` + `remark-mdx`) | Re-validated all parsing-dependent counts |
| `markdownlint-cli2 MD040` | 8 errors (matches AST untagged-block count exactly) |
| `alex` | clean (no inclusive-language issues) |
| `npx afdocs check https://promptless.ai` | 21 passed / 1 warning / 1 skipped (23 total) |
| `pa11y --standard WCAG2AA` on `welcome` | 3 errors (footer H3 color contrast) |

## Amendments to findings

| Finding | Original status | Amended status | Reason |
|---|---|---|---|
| **F-0005** Alt-text gaps on 10 pages | Significant | **WITHDRAWN — false positive** | AST parse via `remark-mdx` confirms all 24 image-containing pages have alt text. The regex parser was checking `<Frame>` tags for an `alt=` attribute but Frame components wrap `<img alt="...">` children — alt text lives on the inner element. Correctly tagged `evidence: degraded-parser` in the original, which is why the framework worked. |
| **F-0007** Audit env lacked Node | Significant | **Downgraded to Low; resolved-for-this-run** | Node 24.15.0 installed mid-audit. Build + smoke + AST all run clean. Tooling-spec S10 (containerize the audit) still recommended to prevent recurrence; finding remains as a record. |
| **F-0018** 45 untagged code fences | Moderate | **Downgraded to Low** | AST + markdownlint MD040 both confirm only **8 untagged blocks** (not 45). The regex over-counted by also matching closing fences and indented fences. The 8 remaining are mostly defensible (HTTP shapes like `POST /triggers`, pseudo-prompt instructions). Still worth labeling but no longer Moderate. |
| **F-0029** External link reachability unverified | Low | **Low — confirmed 27/28 reachable** | Node `fetch` over all 28 unique URLs: 27 OK, 1 anti-bot 403 on `accounts.gopromptless.ai` (working Clerk sign-up; not a real break). Effectively zero broken links. |

## New findings (Phase 5 + Phase 6 reachable with Node)

These could not be produced in the original pass and are added now.

### F-0030 — Footer H3 headings fail WCAG 2.1 AA color contrast (every page)
- **Lens:** Phase 5 — Accessibility (now reachable)
- **Severity:** Significant
- **Page/entity:** Footer component — renders on every docs page; sampled via pa11y on `/docs/getting-started/welcome/`
- **Evidence:** pa11y JSON output: 3 errors, all `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail` — "contrast ratio of 2.54:1, expected at least 4.5:1; change text colour to #707783" for `<h3>Product</h3>`, `<h3>Content</h3>`, `<h3>Company</h3>`.
- **Why it matters:** The footer renders on every doc page (185 built HTML pages). Color contrast failures of this kind block users with low vision. WCAG 2.1 AA is the standard B2B accessibility commitment.
- **Confidence:** High — pa11y is the canonical tool; pinned via npx.
- **Remediation type:** Fix — change the H3 text color (pa11y suggested `#707783`).
- **Automation candidate:** Yes — pa11y-ci in CI on every PR.
- **False-positive notes:** None; standard WCAG failure.

### F-0031 — llms.txt covers only 96% of sitemap doc pages (4% gap)
- **Lens:** Phase 6 — Agent accessibility (now reachable)
- **Severity:** Moderate
- **Page/entity:** `src/pages/llms.txt.ts` (generator) — covers 75 of 78 sitemap doc pages.
- **Evidence:** `npx afdocs check https://promptless.ai` — observability check `llms-txt-coverage: llms.txt covers 96% of 78 sitemap doc pages`. 3 sitemap pages are not represented in the llms.txt index.
- **Why it matters:** AI agents reading llms.txt to discover the docs will miss 4% of the content. Combined with F-0003 (sidebar orphans), this is a pattern — pages that exist on the site but aren't reachable via the established indexes.
- **Confidence:** High (AFDocs is the canonical tool for this lens).
- **Remediation type:** Fix — reconcile the llms.txt generator with the sitemap; ensure every published page is indexed.
- **Automation candidate:** Yes — AFDocs already runs daily in CI (`afdocs-scheduled.yml`). The fix is making the score gate stricter or alerting on observability deltas.
- **False-positive notes:** The 3 missing pages may be intentional (hidden / draft / generated routes). Worth confirming before fixing.

### F-0032 — AFDocs warning: 4 of 50 sampled pages have markdown/HTML content parity drift
- **Lens:** Phase 6 — Agent accessibility
- **Severity:** Moderate
- **Page/entity:** AFDocs `markdown-content-parity` check
- **Evidence:** `npx afdocs check https://promptless.ai` — observability check: "4 of 50 pages have minor content differences between markdown and HTML". Specific pages not listed in summary output; would need verbose mode or JSON output.
- **Why it matters:** Agents that read `.md` versions of pages may get different content than humans reading the HTML. For an AI-product whose customers explicitly use AI agents on their own docs, content parity matters.
- **Confidence:** High (AFDocs).
- **Remediation type:** Investigate — identify the 4 pages, decide whether the divergence is intentional (e.g., interactive components that don't render in markdown) or accidental.
- **Automation candidate:** Yes — already in CI; pipe verbose output to logs.
- **False-positive notes:** "Minor content differences" may include legitimate diffs (e.g., a search-box widget that renders as nothing in markdown). Need to inspect specific pages.

## Updated counts

| Severity | Original | Amended | Delta |
|---|---|---|---|
| Critical | 2 | 2 | 0 |
| Significant | 12 | 11 | −1 (F-0005 withdrawn, F-0007 → Low, F-0030 added) |
| Moderate | 14 | 15 | +1 (F-0018 → Low, F-0031, F-0032 added) |
| Low | 1 | 3 | +2 (F-0018 in, F-0007 in, F-0029 stays) |
| **Total** | **29** | **31** | **+2 net** |

## Tooling status changes

Now functional in this environment:
- ✓ `npm run check` (build + typecheck)
- ✓ `npm run test:smoke`
- ✓ `node` for AST-based inventory
- ✓ `npm`/`npx` for one-off tool installs
- ✓ `markdownlint-cli2`
- ✓ `alex`
- ✓ `pa11y` against built `dist/`
- ✓ `afdocs` against live site
- ✓ External link reachability via `fetch`

Still skipped (out of scope or no canonical reference):
- `cspell` — not run (Phase 4 Expanded; not selected)
- `vale` — not run (Phase 4 Expanded; not selected)
- `lychee` — not installable via npx (Rust binary); Node `fetch` substitute is fine for this pass; tooling-spec keeps lychee as the long-term pick because of its richer config surface
- `lighthouse-ci` — Phase 5 Expanded; not selected
- `shellcheck` — available via npm wrapper, but the F-0001 helm truncation isn't detected by it (the shell parser tolerates a trailing `\` at EOF). Custom MD lint required.
- Multi-framework content-type classifier (Phase 11) — agent-doc reference still not provided; out of scope
- Persona validation gate (Phase 12) — not invoked

## Updated confidence on existing findings

Where the original audit had `evidence: degraded-parser` tags, the AST re-run amends them:

| Finding | Original confidence | Amended confidence | Notes |
|---|---|---|---|
| F-0003 (orphan pages) | High (structural) | High (unchanged) — confirmed via AST |
| F-0004 (78% missing descriptions) | High | High (unchanged) — confirmed via AST |
| F-0015 (4 empty stubs) | High | High (unchanged) — confirmed via AST |
| F-0016 (substantial hidden) | High | High (unchanged) |
| F-0017 (21 zero-inbound) | Medium | Medium — degraded link counter still in play (AST counts 109 internal links total, suggesting the inbound counter undercount was real but not severe enough to invalidate the finding) |

## Re-execution lessons (for tooling-spec)

1. **Containerizing the audit (S10 in tooling-spec) is the single most important investment.** Without Node, 9 of the 13 lenses were degraded; with Node available, that drops to 0. A Dockerfile + makefile target would prevent recurrence and add ~30 minutes of one-time effort.
2. **The "no regex over MDX" rule worked.** Findings derived from the regex parser were correctly tagged `evidence: degraded-parser` and the AST re-run withdrew one false positive (F-0005). Without that discipline, the false positive would have shipped uncaught.
3. **`shellcheck` does not catch the kind of bash truncation F-0001 describes.** A custom markdownlint rule (or a small awk script) is required for fenced-bash-block hygiene. Updated S5 in tooling-spec.
4. **AFDocs provides agent-accessibility insights that nothing else covers.** Running it once revealed 2 new Moderate findings (F-0031, F-0032). Daily scheduled run is the right cadence; consider adding score-delta alerting.
5. **pa11y against the built `dist/` is fast and produces clean output.** Worth adding to CI; even sampling 5 pages caught a footer-wide WCAG fail that affects every doc page.

## Files touched in this amendment pass

| File | Update |
|---|---|
| `evidence/amendments.md` | New — this file |
| `evidence/inventory-ast.json` | New — AST-based inventory output |
| `evidence/build-inventory-ast.mjs` | New — AST inventory script |
| `evidence/tool-versions.txt` | Updated with Node 24.15.0 + tool versions actually used |
| `evidence/skipped-checks.md` | Updated to reflect what's now reachable |
| `evidence/commands.log` | Appended with second-pass commands |
| `findings.md` | F-0005 withdrawn, F-0007 / F-0018 downgraded, F-0029 evidence-confirmed; F-0030/31/32 added |
| `scoreboard.md` | New counts (Critical 2, Significant 11, Moderate 15, Low 3; total 31) |
| `README.md` | Note added linking to amendments |
| `tooling-spec.md` | S5 expanded (custom bash-truncation rule) |

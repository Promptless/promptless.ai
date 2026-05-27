# Inventory — `src/content/docs/` (audit 2026-05-18)

Generated from [evidence/inventory.csv](evidence/inventory.csv) via [evidence/build-inventory.py](evidence/build-inventory.py). See [README.md](README.md) for environment caveats — body parsing ran in **degraded mode** (no AST parser; targeted regex patterns only).

## Summary

| Metric | Value |
|---|---|
| Total published docs (mdx) | 59 |
| Hidden in sidebar (`sidebar.hidden: true`) | 8 |
| Visible in sidebar | 51 |
| Sidebar orphans (in tree, NOT in nav) | 10 |
| Sidebar ghosts (in nav, NO matching MDX) | 0 |
| Lacking `description:` frontmatter | **46 (78%)** |
| Median age (days since last commit) | 23 |
| Max age (days) | 82 |
| Pages > 2000 words | 0 |
| Pages < 100 words (stub candidates) | 5 |
| Pages with images and incomplete alt-text | 20 |
| Pages with zero inbound docs links | 21 (excluding hidden) |

## Sidebar orphans (in tree, not in nav)

**True orphans (NOT hidden, real content, unreachable from nav):**

| Slug | Words | Age | Has description? |
|---|---|---|---|
| `docs/configuring-promptless/context-sources/notion` | 536 | 18d | no |
| `docs/how-to-use-promptless/agent-knowledge-base` | 315 | 9d | yes |

These two are real content that users cannot find via the sidebar. They will appear in `llms-full.txt` (which iterates the content collection directly) and may rank in search, but are invisible to humans browsing the docs.

**Hidden orphans (`sidebar.hidden: true` and absent from nav; expected, but flagged for review):**

| Slug | Words | Age | Notes |
|---|---|---|---|
| `docs/core-concepts` | 0 | 82d | Empty parent stub. |
| `docs/core-concepts/context-sources` | 0 | 82d | Empty stub. |
| `docs/core-concepts/doc-locations` | 0 | 82d | Empty stub. |
| `docs/core-concepts/triggers` | 0 | 82d | Empty stub. (Note title casing: "triggers" lowercase.) |
| `docs/frequently-asked-questions/recommended-docs-providers` | 287 | 82d | Has content but hidden. Why? |
| `docs/getting-started/pilot-overview` | 1007 | 14d | Substantial content, recent edits, but hidden. Intentional draft? |
| `docs/self-hosting` | 643 | 82d | Self-hosting parent — substantial. Hidden seems wrong. |
| `docs/self-hosting/kubernetes-helm` | 1037 | 18d | The only self-hosting page. Hidden but in sidebar config under a different label? Check nav. |

## Stub pages (<100 words of prose)

| Words | Hidden | Slug | Notes |
|---|---|---|---|
| 0 | yes | `docs/core-concepts/context-sources` | Empty stub |
| 0 | yes | `docs/core-concepts/doc-locations` | Empty stub |
| 0 | yes | `docs/core-concepts/triggers` | Empty stub (lowercase title) |
| 0 | yes | `docs/core-concepts` | Empty parent stub |
| 98 | no | `docs/how-to-use-promptless` | Section landing — very thin; likely orienting users only via the sidebar children |

## Alt-text gaps (accessibility risk)

20 pages contain images with incomplete alt-text. **10 of these have a 0.0 ratio** — no alt text at all on any image:

- `docs/account-management/account-management` (3 imgs, no alt)
- `docs/configuring-promptless/context-sources/{jira, linear}` (1 img each)
- `docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code` (1 img)
- `docs/configuring-promptless/triggers/{git-hub-commits, git-hub-p-rs, slack-messages}` (2 imgs each)
- `docs/how-to-use-promptless/{agent-knowledge-base, deep-analysis, managing-environment-variables}` (1–2 imgs)

Remaining 10 pages have partial alt coverage (some images alt-tagged, some not).

## Missing-description summary

**46 of 59 pages (78%)** have no `description:` field in frontmatter. Affects:
- SEO (no meta description served)
- Sidebar/card rendering (no description tooltip)
- `/llms.txt` and `/llms-full.txt` (agent comprehension)
- Internal search (no snippet)

## Findability — hub pages and zero-inbound pages

**Top inbound hubs:**

| Slug | Inbound docs links |
|---|---|
| `docs/integrations/github-integration` | 6 |
| `docs/integrations/slack-integration` | 5 |
| `docs/configuring-promptless/triggers/git-hub-commits` | 3 |
| `docs/integrations/atlassian-integration` | 3 |

**Pages with zero inbound links (excluding hidden):** 21 pages, including foundational ones like `welcome`, `getting-help`, `promptless-1-0`, all of `getting-started`. These rely entirely on sidebar nav and external links — no cross-page reinforcement. Findability risk if a user lands directly on any of these.

## Slug / URL hygiene observations (passing notes; not formally findings yet)

Several slugs use awkward kebab-case derivations:

| Slug | Suggested |
|---|---|
| `git-hub-p-rs` | `github-prs` |
| `git-hub-commits` | `github-commits` |
| `git-hub-issues` | `github-issues` |
| `git-hub-repos-docs-as-code` | `github-repos-docs-as-code` |
| `git-hub-enterprise-integration` | `github-enterprise-integration` |
| `intercom-integration-beta` | `intercom-integration` (use frontmatter status or a label instead of `-beta` suffix) |
| `single-sign-on-sso-setup` | `sso-setup` |
| `compliance-and-certifications` | `compliance` |

Slug changes are URL-affecting and require redirects (`src/lib/generated/redirects.json` already supports this). Spec-level remediation only — not action items for this round.

## Age distribution

- **0–14 days:** ~16 pages — recent active work
- **15–60 days:** ~32 pages — settled
- **60+ days:** ~11 pages — older, mostly the hidden stubs and a few stable references

No "stale" content (>180 days) per the proposed freshness cadence in `theater-report.md` (not run this round). Worth re-checking in Phase 9 against system-graph drift.

## Raw data

- [evidence/inventory.csv](evidence/inventory.csv) — full row-per-page metrics (24 columns)
- [evidence/inventory.json](evidence/inventory.json) — same data + sidebar orphan/ghost lists, for downstream phases

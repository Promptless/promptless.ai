---
name: launch-post
description: |
  Write Promptless launch articles by triaging recent changelog entries and
  writing a focused, single-feature post for each one that meets the bar:
  significantly improves UX for a non-trivial segment of users, OR adds
  substantial new capabilities to the Promptless product.

  Intended to run as a weekly scheduled task — it scans the last 7 days of
  commits to `src/content/changelog/changelogs/` for newly added entries,
  decides which (if any) warrant a post, researches the backing PRs in
  `Promptless/promptless`, and opens one PR per qualifying feature.

  Use this skill when:
  - The weekly cron fires ("/launch-post", "run the weekly launch post check")
  - The user says "any launch posts worth writing this week?"
  - The user pastes a single changelog entry and asks for a launch post
  - The user points at a specific feature and asks for a focused post
  - The user asks to backfill a month of launch posts ("backfill March 2026",
    "generate launch posts for February")
  Always triage first — most changelog entries do not warrant a launch post.
  A typical week produces zero or one post; a typical month produces 2–4.
---

# Launch Post

Triages recent Promptless changelog entries, picks out the ones that genuinely warrant a launch article, and writes one focused single-feature article per qualifier.

## Overview

0. Determine the scan window and collect candidate changelog entries
1. Triage each entry against the bar
1.5. Filter out duplicates (features that already have a launch post or a draft PR)
2. For each qualifier: research the backing PR(s), write a focused single-feature article, open a PR, notify Slack

For Mode D (monthly backfill), insert a **preview + confirm** step between 1.5 and 2 — see the Mode D section in Step 0.

Most weeks: 0–1 qualifiers. Occasionally 2. More than 2 in a week is rare — if you're tempted to pick 3+, recheck the bar.

---

## Step 0: Collect candidate changelog entries

There are four invocation modes. Pick the one that matches the user's request.

### Mode A — Weekly scheduled run (default)

Scan commits on the changelog directory from the last 7 days:

```bash
cd ~/dev/docs
git fetch origin main
git log --since="7 days ago" origin/main -- src/content/changelog/changelogs/ \
  --pretty=format:'%H%x09%ai%x09%s'
```

For each commit, read the diff to extract the newly added changelog entry:

```bash
git show --format= "$SHA" -- src/content/changelog/changelogs/
```

Each commit typically adds one entry. Collect the feature name, the short description, and any PR number referenced in the commit message or entry body.

### Mode B — Single-entry request

The user pasted one changelog entry and wants a post for it. Skip to Step 1 triage on just that entry. If it qualifies, write it. If it doesn't, say so and stop — don't write the post just because it was asked for.

### Mode C — Named feature

The user names a specific feature ("write a post for the AGENTS.md support"). Treat it as a single entry and assume the user has already decided it qualifies. Skip triage, go straight to research and writing. Still produce a single-feature post, not a roll-up.

### Mode D — Monthly backfill

The user asks to backfill a specific month ("backfill March 2026", "generate launch posts for February 2026"). Scan all commits that touched the changelog directory within that calendar month:

```bash
cd ~/dev/docs
git fetch origin main
# Example: March 2026
git log --since="2026-03-01" --until="2026-04-01" origin/main \
  -- src/content/changelog/changelogs/ \
  --pretty=format:'%H%x09%ai%x09%s'
```

**Cap the range at one calendar month.** If the user asks for a longer period (a quarter, a year), ask them to run it one month at a time — longer ranges produce too many PRs to review in one batch.

Collect entries the same way as Mode A (one per commit, usually).

After Step 1 triage completes, **before firing Step 2**, preview the plan and get the user's confirmation. See "Preview + confirm (Mode D only)" below.

---

## Step 1: Triage each entry

**The bar:**

A changelog entry warrants a launch post if it meets at least one of these:
- **Significantly improves UX for a non-trivial segment of users** — a real, describable group of users can now do something meaningfully better or avoid something meaningfully painful.
- **Adds substantial new capabilities to the Promptless product** — a new trigger, integration, workflow, or configuration that unlocks something previously impossible.

**Clear YES:**
- New trigger types, new integrations, new platform support
- New configuration that unlocks a workflow (e.g. version branch targeting for teams with versioned docs)
- New first-class capabilities (e.g. AGENTS.md as a style guide source)

**Clear NO:**
- Bug fixes, even important ones (goes on the changelog, not in a launch post)
- Internal refactors, dependency upgrades, logging changes
- Copy tweaks, minor UI polish
- Performance improvements with no visible UX change

**Borderline — default to NO:**
- Performance improvements with visible impact (only yes if the delta changes how users work)
- UI reorganizations (only yes if they materially change a core workflow)
- Expanded configuration on an existing capability (only yes if it opens a new use case)

For each entry, output a one-line triage decision: `QUALIFIES` or `SKIP — {reason}`. Be explicit about which criterion from the bar is met for qualifiers.

If **zero** entries qualify, stop. Report:
- The entries you considered
- Why each was skipped
- What kind of change would meet the bar next week

Don't write a post just to have something to show. Zero is a valid answer.

---

## Step 1.5: Check for duplicates

**Mandatory for every mode.** Never write a launch post for a feature that already has one (or has an open draft PR). Running a second post on the same feature is a hard failure — catch it here.

For each qualifier from Step 1, do the following checks in order:

### 1. Scan existing posts

List every existing launch post and read its frontmatter to see what feature it covers:

```bash
ls src/content/blog/product-updates/
```

For each `.mdx` file, read the frontmatter `title` and `description` (and skim the opening paragraph if the title is ambiguous). Compare **semantically** against the qualifier, not just by slug. A different filename can still describe the same feature.

Examples of matches to catch:
- Qualifier "AGENTS.md support" vs. existing post titled "Using AGENTS.md as a Style Guide Source" → **duplicate**
- Qualifier "First-approval trigger" vs. existing post "Wait for First Review Before Generating Docs" → **duplicate**
- Qualifier "Starlight support" vs. existing post "Starlight (Astro) Docs Platform Support" → **duplicate**

### 2. Check open draft PRs

A post might already be in flight from an earlier skill run. Check open PRs that add to the product-updates directory:

```bash
gh pr list --repo Promptless/promptless.ai --state open \
  --search "path:src/content/blog/product-updates/" \
  --json number,title,headRefName,files --limit 20
```

Read each result's title and changed files. If any open PR already covers the qualifier, it's a duplicate.

### 3. Decide

- **Exact match** (same feature already has a merged post or an open PR) → drop the qualifier, log the duplicate in the triage table, continue with the rest.
- **Borderline match** (similar-but-distinct — e.g. "first-approval trigger" vs. an older post about "draft PR skipping") → pause and ask the user. Don't write speculatively.
- **No match** → proceed to Step 2.

If a qualifier is dropped as a duplicate, still include it in the PR's "Entries considered this run" table with `SKIP — duplicate of {existing post title or PR #}` so the reviewer can audit the decision.

---

## Preview + confirm (Mode D only)

After Step 1.5, **before firing Step 2**, print the backfill plan and wait for confirmation. Monthly backfills can produce several PRs at once, and the reviewer needs a chance to drop entries or cap the count before the skill starts opening PRs and pinging Slack.

Print:

```
Backfill plan — {Month Year}

{N} commits in window. {M} entries considered. {K} qualifiers after dedup:

Qualifiers (will write posts for these):
  1. {feature title} — {one-line reason}
  2. {feature title} — {one-line reason}
  ...

Skipped ({S}):
  - {feature title} — {reason}
  - {feature title} — {reason}
  ...

Dropped as duplicates ({D}):
  - {feature title} — duplicate of {existing post or open PR}
  ...

Proceed with all {K} qualifiers? Reply with one of:
  - "yes" to write all {K} posts
  - "drop {1,2}" to remove specific entries by number
  - "cap 2" to write only the top N qualifiers
  - "no" to abort
```

Wait for the user's reply before proceeding. Do **not** open any PRs until confirmed. For Modes A, B, and C, skip this step and go straight to Step 2.

---

## Step 2: For each qualifier — research, write, ship

### 2a. Research the backing PR(s)

```bash
gh pr list --repo Promptless/promptless --state merged \
  --search "{feature keyword}" --limit 10 \
  --json number,title,body,mergedAt,url

gh pr view {number} --repo Promptless/promptless \
  --json title,body,mergedAt,url,files
```

For each feature, extract:
- **The problem it solves** — what was breaking or painful before
- **How it works** — user-visible behavior (not code)
- **Who benefits most** — which team type or workflow
- **Any setup required** — configuration, opt-in, caveats

If a PR description is thin, check linked issues: `gh issue view {number} --repo Promptless/promptless`. The local repo at `~/dev/promptless` is available too, but `gh` on the remote is usually faster.

Don't over-research. 2–3 concrete facts is enough.

### 2b. Write the article

Read `references/launch-article-guide.md` for voice, structure, MDX format, and the banned-pattern list.

Core job of a launch article: answer three questions about **one** feature.
1. What changed? (one sentence)
2. How does it work now? (concrete, behavioral)
3. What does this mean for the user? (the implication — what they can do, avoid, or stop worrying about)

One feature per article. No roll-ups. No "also in this release" sections — skipped entries stay skipped.

### 2c. Save + open PR

File location:
```
src/content/blog/product-updates/{feature-slug}.mdx
```

Slug: lowercase, hyphens, derived from the feature name. Examples: `first-approval-trigger-mode.mdx`, `agents-md-support.mdx`, `version-branch-targeting.mdx`. **Do not** use month/quarter slugs.

Branch + worktree (one per article):
```bash
git fetch origin main
BRANCH="articles/$(date +%Y-%m-%d)-{feature-slug}"
WORKTREE=".worktrees/$(echo $BRANCH | tr '/' '-')"
git worktree add -b "$BRANCH" "$WORKTREE" origin/main

cd "$WORKTREE"
git add src/content/blog/product-updates/{feature-slug}.mdx
git commit -m "content: Launch post — {feature title}

Generated by launch-post skill."
git push -u origin "$BRANCH"
```

PR:
```bash
gh pr create --title "content: Launch post — {feature title}" --body "$(cat <<'EOF'
## Feature
{one-sentence description}

## Entries considered this run

Window: {start date} → {end date}.

| # | Entry | Decision | Reason |
|---|-------|----------|--------|
| 1 | **{feature name}** — {short description} | QUALIFIES | {which bar criterion was met} |
| 2 | **{feature name}** — {short description} | SKIP | {reason — bug fix / internal / polish / etc} |
| ... | ... | ... | ... |

{N} commit(s) in window. {M} entries considered, {K} qualified.

## Covered entry (full text)
> {quote the entry verbatim, including any markdown formatting}

Source: commit [{short sha}]({commit url}).

## PR(s) researched
- [Promptless/promptless#{num}]({url}) — {title} (merged {date})

## File
`src/content/blog/product-updates/{feature-slug}.mdx`

AI-generated draft — needs human review before publishing.
EOF
)"
```

**Always include the full "Entries considered this run" table**, even when only one entry is in window or zero entries were skipped. The reviewer uses this to audit triage decisions — so they need to see every candidate, not just the ones that made it through.

Cleanup:
```bash
cd -
git worktree remove --force "$WORKTREE"
```

### 2d. Notify Slack

One message per PR:

```bash
agent-slack message send --workspace promptless "#gtm" \
  "New launch post draft: {feature title} — {pr_url}"
```

---

## Notes

- `hidden: false` in frontmatter always.
- If `gh`, `git`, or `agent-slack` fails, report the failure and continue with the remaining qualifiers.
- If no PR can be found for a feature, write what you can from the changelog entry. Don't block on research.
- Typical week: 0–1 posts. Typical month: 2–4. If your triage produces more, recheck the bar.
- The goal is a post a prospect could read to understand *one* thing Promptless shipped and why they should care. Not a press release. Not a monthly summary.

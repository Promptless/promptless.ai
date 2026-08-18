---
name: generate-article
description: |
  Generate a blog article for the Promptless edu campaign. Researches a keyword via web search, writes a publication-ready MDX draft, commits it to a new branch, opens a GitHub PR, and posts the PR link to Slack.
  Use this skill when:
  - The user asks to generate, write, or draft a blog article or blog post
  - The user mentions the "edu campaign" or "content pipeline"
  - The user wants to create content for a keyword from the keyword list
  - The user says "generate article", "write a blog post", "new blog draft", or similar
  Even if the user just says something like "pick a keyword and write an article" or "run the content pipeline", use this skill.
---

# Generate Article (Edu Campaign)

Automated content pipeline for the Promptless blog. This skill replaces the `generate-article.ts` script by using Claude Code's native tools (web search, file writing, git, gh CLI, agent-slack) instead of calling the Anthropic API programmatically.

## Overview

1. Pick a keyword and clear the pre-flight duplicate gate
2. Research the topic thoroughly using web search
3. Write a publication-ready MDX article
4. Commit to a new branch, push, and open a GitHub PR
5. Post the PR link to the `#gtm` Slack channel

## Step 1: Pick a keyword and clear the pre-flight gate

If the user provides a keyword or topic, use it directly.

Otherwise, read the keyword list at `scripts/edu_campaign/keywords.txt` (relative to repo root). Lines starting with `#` are comments — skip them.

Do NOT pick at random. Random selection has no memory, so it re-picks recently used keywords: it produced ten articles on "docs site search optimization" in four months. Instead, prefer the keyword with the least existing coverage. Work down the list from the top and pick the first keyword that clears the gate below.

### The pre-flight gate is blocking

Before doing any research, run:

```bash
scripts/edu_campaign/preflight-keyword.sh --keyword "<keyword>"
```

**If it exits non-zero, stop. Do not research, do not write, do not open a PR.** Either pick a different keyword and re-run, or report the blockage to the user and end the run. This gate is the one step that is allowed to halt the pipeline, and it must.

The script checks two things the pipeline previously missed:
- How many articles on this keyword are already **published** on `origin/main` (cap: 2)
- Whether any **open or closed PR** already covers this keyword

That second check is the important one. The old duplicate check ran late and looked only at merged content, so nine unmerged siblings were invisible to it and every run concluded it was the first on the keyword.

Tell the user which keyword was selected and paste the gate's output.

## Step 2: Research

Use the WebSearch tool to research the keyword. Search for 5-8 of the best recent articles, studies, blog posts, and discussions on the topic. Focus on 2024-2026 material. For each source, identify:

- The main angles already covered
- Data points or case studies cited
- Gaps in existing coverage
- What practitioners are actually struggling with

Read the most relevant results thoroughly using WebFetch.

After researching, extract from what you found:

- **1-2 related keywords:** Terms or phrases that kept appearing alongside the main keyword — especially newer or more specific variants (e.g. searching "knowledge base" might surface "personal wiki" or "second brain"). These are candidates for targeting in the article instead of or alongside the original keyword.
- **1-2 key ideas:** Specific insights, trends, or framings from the research worth building the article around (1-2 sentences each). These should be concrete and grounded in what you actually read — not generic observations.

Report these to the user before moving on. Use them in Step 3 to sharpen the article's angle.

## Step 3: Plan the article

Before writing, produce a detailed plan. The plan must answer:

- **Keyword(s) to target:** Which keyword(s) — the original, the related ones from Step 2, or a combination — should this article target? Pick what gives the article the sharpest angle and best SEO fit.
- **Key ideas to build on:** Which 1-2 ideas from Step 2 will anchor the article? State them clearly.
- **Article format:** What format best serves this content and reader? Describe it concretely, e.g. "a comparison of two approaches to help readers make a technical decision" or "an explainer that teaches readers why X matters before showing them what to do about it."
- **Thesis:** The single main point this article makes, in one sentence.
- **Target reader:** Who specifically benefits — developers, technical writers, solutions engineers, product managers, developer advocates? What do they already know, and what gap does this fill?
- **Key points:** 4-6 specific claims or arguments the article will make, in order. Each should be concrete — not "discuss X" but "argue that X causes Y because Z."
- **Evidence:** For each key point, what data, case studies, or examples from the research support it, with links.
- **Promptless connection:** How the article's thesis connects to what Promptless does. Not a sales pitch — a logical continuation. E.g. "This article argues that docs go stale faster than teams notice, which is exactly the problem Promptless monitors for."

Output the plan to the user for review before writing.

## Step 4: Write the article

Before writing, scan the existing articles in `src/content/blog/technical/` to:
- Find posts to link to internally (read titles/descriptions of a few to understand voice)
- Calibrate your tone to match the existing body of work

Duplicate detection is NOT this step's job. It happens at Step 1, before the expensive research, and it is blocking. A check that runs here can only tell you that you have already wasted the research budget.

If your research in Step 2 surfaced a related keyword and you decided in Step 3 to target that instead of the original, re-run the gate for the new keyword now:

```bash
scripts/edu_campaign/preflight-keyword.sh --keyword "<the keyword you actually chose>"
```

Retargeting mid-run is how a cleared keyword turns into a duplicate of something else.

Then write a complete, publication-ready MDX article strictly following the plan and the style guide.

### Writing style

Read `references/style-guide.md` in this skill's directory for the complete writing style and structural conventions.

Key points:
- 10th grade reading level. Short sentences, plain words.
- Direct and dry, like a Dutch engineer. No filler, no fluff.
- Grounded in concrete examples, real numbers, and cited evidence.
- Do NOT use em dashes.
- Do NOT use tricolon structures (three-item lists for rhetorical effect, e.g. "It's fast, reliable, and cheap").
- Do NOT use "X is not Y, but Z" constructions.

### Structural conventions

- Use `##` for H2 sections, `###` for H3
- Aim for 800-1400 words
- Lead with a hook that frames the specific problem — NOT a generic intro paragraph
- Do NOT include a generic conclusion that restates what was said
- Place `<BlogNewsletterCTA />` at roughly the 40-50% mark (after the first major section)
- End the article with `<BlogRequestDemo />`

### MDX frontmatter format

```
---
title: 'Article Title Here'
subtitle: Published {month} {year}
description: >-
  One or two sentence SEO description, 120-160 characters.
date: '{YYYY-MM-DD}T00:00:00.000Z'
author: Frances
tag: {tag}
section: Use Cases
hidden: false
---
import BlogNewsletterCTA from '@components/site/BlogNewsletterCTA.astro';
import BlogRequestDemo from '@components/site/BlogRequestDemo.astro';

[article body starts here]
```

Fill in the current date and month/year. For `tag`, choose the best fit from: `Technical`, `Opinion`, `Customer Stories`, `Life at Promptless`.

## Step 5: Edit pass

Do a final editorial pass specifically rewriting every instance of:
1. "X is not Y, but Z" constructions — rewrite as a direct statement
2. Tricolon structures — break up or cut to the most important item
3. Em dashes — replace with periods, commas, or parentheses
4. Optimize SEO: update title, subtitle, and description to match what users would search for
5. Add relevant links to other Promptless blog posts where appropriate (check `src/content/blog/` for existing posts)

## Step 6: Save the file

The article file goes at:
```
src/content/blog/technical/{slug}.mdx
```

Generate the slug from the article **title**, not from the keyword: lowercase, remove special characters, replace spaces with hyphens, truncate to 60 characters.

Derive it from the part of the title that is specific to THIS article. Seven PRs slugged themselves `docs-site-search-optimization` because they all shared that title prefix and the distinguishing half of each title was dropped. If two candidate titles would produce the same slug, the slug is wrong: use the specific angle instead (`developer-docs-search-three-channels`, not `docs-site-search-optimization`).

### Slug uniqueness is a hard precondition

Once the title is settled, and before creating the branch, re-run the gate with the slug:

```bash
scripts/edu_campaign/preflight-keyword.sh --keyword "<keyword>" --slug "<slug>"
```

**If it exits non-zero, stop and pick a different slug.** Do not create the branch.

This checks the slug against `origin/main` AND against every open PR. Both matter: seven PRs collided with each other rather than with anything merged, so each one passed a main-only check and still produced a conflict. Two PRs adding the same path will always conflict, no matter how cleanly each merges against main today.

## Step 7: Create a branch and PR

Use a git worktree so the skill doesn't interfere with whatever branch the user currently has checked out. This is especially important in remote tasks where the working directory may have uncommitted changes.

```bash
# Fetch latest main
git fetch origin main

# Create a worktree on a new branch
BRANCH="articles/{date}-{slug}"
WORKTREE=".worktrees/$(echo $BRANCH | tr '/' '-')"
git worktree add -b "$BRANCH" "$WORKTREE" origin/main
```

Write the article MDX file into the worktree (at `{worktree}/src/content/blog/technical/{slug}.mdx`), then commit and push:

```bash
cd "$WORKTREE"
git add src/content/blog/technical/{slug}.mdx
git commit -m "content: Add blog article -- {title}

Keyword: {keyword}
Generated by edu campaign skill"
git push -u origin "$BRANCH"
```

Create the PR from the worktree:
```bash
gh pr create --title "content: {title}" --body "$(cat <<'EOF'
**Keyword:** `{keyword}`

## Article plan

{paste the plan summary here}

## File

`src/content/blog/technical/{slug}.mdx`

This is an AI-generated draft and needs human review before publishing.
EOF
)"
```

Then clean up:
```bash
cd -
git worktree remove --force "$WORKTREE"
```

## Step 8: Notify Slack

Post the PR link to the `#gtm` channel using agent-slack:

```bash
agent-slack message send --workspace promptless "#gtm" "New blog article draft ready for review: {title} (keyword: {keyword}) -- {pr_url}"
```

## Important notes

- Always set `hidden: false` in the frontmatter.
- **Continue-on-failure applies only to the delivery steps (Steps 7 and 8).** If `git push`, `gh pr create`, or the Slack notification fails, report the error and continue with the remaining steps: the article is already written and losing it is worse than a missing Slack ping.
- **The pre-flight gates in Step 1, Step 4, and Step 6 are the exception. A non-zero exit from `preflight-keyword.sh` halts the run.** Do not "report the error but continue" past a blocked gate. The old blanket continue-on-failure rule is why nine duplicate articles reached the PR queue: nothing in the pipeline had the authority to stop.
- The article should be genuinely useful content, not thinly-veiled marketing. Promptless connections should feel natural.

# Launch Article Writing Guide

Conventions, structure, and MDX format for a **single-feature** Promptless launch article.

A launch article in this skill is always about **one** feature. If you're tempted to cover two, write two articles.

---

## What a launch article is (and isn't)

A launch article is a short news story about **one thing Promptless shipped**, written for two audiences at once:
- **Existing customers** who want to know what's new and what they can do with it
- **Prospects** evaluating Promptless who want to see concrete, useful shipping

It's **not** a changelog. Changelogs list what changed. Launch articles explain what it means.

A changelog says "First-Approval GitHub PR Trigger Mode." A launch article says "You can now tell Promptless to wait until code has been reviewed before generating documentation suggestions, so you're not processing drafts that might be rewritten."

The test for every sentence: would a user reading this understand what they can do differently now? If not, rewrite it.

---

## Voice and tone

**Direct and dry, like a Dutch engineer.** Clear, concise, no flair. No filler, no fluff. State what shipped, why it matters, who it's for. Move on.

- **Plain statements over conversational hooks.** No "If you've ever wished...", no "Here's the cool part...", no "that's now a single comment away". Just say what it does.
- **Concrete over abstract.** Name the actual workflow. "When a PR gets its first approval" beats "at a configurable trigger point."
- **Honest about tradeoffs.** If a feature fits certain teams better, say so.
- **Not salesy.** No "game-changing", "industry-leading", "best-in-class". Let the feature speak.
- **Humor is OK if it lands naturally.** Never force it. A dry aside works ("We use Starlight for our own docs, so adding support was overdue"). A try-hard one-liner doesn't.
- 10th-grade reading level. Short sentences. Plain words.

**Banned patterns:**
- Em dashes (—). Use a period or comma.
- Tricolon structures ("fast, reliable, and scalable"). Cut to the most important one.
- "X is not Y, but Z." Rewrite as a direct statement.
- Vague adjectives: "powerful", "seamless", "robust", "streamlined", "intuitive".
- Hedging: "essentially", "basically", "in a sense".
- AI writing tells: "In today's fast-paced world...", "It's worth noting that..."
- Conversational hooks that try to create intimacy: "If you've ever wished...", "Picture this...", "Imagine you..."
- Cute asides and performative jokes.

---

## Structure

A single-feature launch article is ~500–900 words. Structure:

### Opening (1–2 short paragraphs)

Lead with the feature and why it matters. Name the specific workflow it touches. Don't preamble about documentation in general.

Good: *"Promptless can now wait for a PR's first code review approval before generating documentation suggestions. If your team heavily rewrites PRs during review, your docs won't be based on code that's about to change."*

Bad: *"Documentation is hard. Teams everywhere struggle with keeping their docs in sync with code..."*

### The problem

One paragraph naming the specific pain this feature addresses. Ground it in a real workflow scenario — a team doing X, hitting Y.

### What it does now

One or two paragraphs explaining the new behavior. Be concrete. Describe what the user sees, configures, or gets. Screenshot if available.

### Who benefits most

One paragraph naming the workflow or team type for whom this is most useful. Calling out the best fit is not a downside — it helps the right users self-identify.

### How to use it

If setup is required — a config option, a new setting, an opt-in — describe it briefly. A single code block or a short list is fine here. If no setup is needed, skip this section.

### Closing (2–3 sentences)

A brief "what's next" or a direct call to action. Don't restate what you just covered.

**Do not** add an "also in this release" section. Other changelog entries belong in other articles or nowhere.

---

## MDX frontmatter

```mdx
---
title: '{Feature name or outcome — concrete, searchable}'
subtitle: Published {Month} {Year}
description: >-
  One or two sentence SEO description. 120–160 characters. Name the specific feature and the user it helps.
date: '{YYYY-MM-DD}T00:00:00.000Z'
author: Frances
tag: Product Updates
section: Featured
hidden: false
---
import Frame from '@components/fern/Frame.astro';
import BlogNewsletterCTA from '@components/site/BlogNewsletterCTA.astro';
import BlogRequestDemo from '@components/site/BlogRequestDemo.astro';
```

- `tag` must be `Product Updates`.
- `section` is typically `Featured`.
- Import `Frame` only if you have a screenshot to embed.
- Always import `BlogNewsletterCTA` and `BlogRequestDemo`.
- Always set `hidden: false`.

**Title guidance:**
- Name the specific feature or outcome: "First-Approval Trigger Mode", "Version Branch Targeting for Versioned Docs", "AGENTS.md as a Style Guide Source".
- Avoid generic titles: "April 2026 Product Update", "What's New This Month", "A New Way to Work with Promptless".

---

## Body layout

The body is mostly prose. Use subheadings sparingly — a single-feature post rarely needs more than one or two `##` sections beyond the opening.

Place `<BlogNewsletterCTA />` once, after "What it does now" or "Who benefits most". End the article with `<BlogRequestDemo />`.

---

## Images

If a screenshot exists, embed it near the "What it does now" section:

```mdx
<Frame>
  <img src="{s3-url}" alt="{descriptive alt text}" />
</Frame>
```

Screenshot URLs follow the pattern:
`https://promptless-customer-doc-assets.s3.amazonaws.com/docs-images/org_2lvkgU9erOFxYhtEVVC0ymPrPdF/{filename}`

If you don't have a URL, skip. Don't add placeholders or broken links.

---

## Length

- **500–900 words** for a standard single-feature launch article.
- If the feature is genuinely substantial (major integration, new workflow with several distinct parts), you can go up to ~1,100 words. Rare.
- If you can't get to 500 words without padding, the feature probably doesn't clear the bar for a launch article. Go back to triage.

---

## What to include vs. what to skip

**Include:**
- The specific user pain this feature addresses, grounded in a real workflow
- What the user can do now that they couldn't before
- Any configuration or opt-in they need to know about
- Who benefits most (team type, workflow type)

**Skip:**
- Other features shipped the same week (they get their own posts or none)
- Bug fixes shipped alongside the feature
- Internal implementation details
- Generic intros about the state of documentation, developer productivity, etc.

---

## Example: good single-feature post (excerpt)

```
## The problem

Teams that squash-merge or heavily rewrite PRs during review often found that
triggering on PR open meant Promptless generated suggestions for code that
changed significantly before merging. Reviewers would then see documentation
suggestions for commits that no longer existed on the final branch.

## What changed

You can now configure a trigger to fire when a PR gets its first approval
instead of when it opens. Documentation suggestions show up after the code
has been reviewed, not on every work-in-progress push.
```

## Example: bad (reads like a changelog)

```
## First-Approval GitHub PR Trigger Mode

Configure Promptless to trigger when a pull request receives its first approval
instead of when it opens — useful for teams that want documentation suggestions
only after code has been reviewed.
```

The bad version tells you what the feature does but not why you'd use it or what it costs you if you don't. It also uses an em dash, which is banned.

---
name: generate-article
description: |
  DISABLED. The Promptless edu-campaign blog generator is turned off as of
  2026-10-13. This skill exists only so that any scheduled routine, cron, or
  person who still invokes it gets a clear stop instead of silently writing an
  article. Use this skill when:
  - A scheduled run fires "/generate-article" or "run the content pipeline"
  - The user asks to generate, write, or draft an edu-campaign blog article
  - The user mentions the "edu campaign" or "content pipeline"
---

# Generate Article (Edu Campaign) — DISABLED

The automated edu-campaign content pipeline was turned off on 2026-10-13. The
generated `content:` PRs were no longer being merged, and the open backlog was
closed at the same time.

## What to do when this skill is invoked

Stop. Do not do any of the following:

- Do not pick a keyword, research a topic, or draft an article.
- Do not create a branch, commit, push, or open a pull request.
- Do not post to Slack.

Reply with one sentence: the edu-campaign article generator is turned off, and
point at this file.

If a scheduled routine invoked this skill, the routine itself should be
disabled at https://claude.ai/code/routines so it stops firing.

## Re-enabling

The previous instructions, the keyword list, and the duplicate pre-flight
script are in git history (see the commit that introduced this file). The
style guide in `references/style-guide.md` is kept as a reference for
hand-written posts.

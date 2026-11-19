---
name: launch-post
description: |
  DISABLED. The automated Promptless launch-post writer is turned off as of
  2026-10-13. This skill exists only so that any scheduled routine, cron, or
  person who still invokes it gets a clear stop instead of silently writing a
  post. Use this skill when:
  - The weekly cron fires ("/launch-post", "run the weekly launch post check")
  - The user asks for launch posts for recent changelog entries
  - The user asks to backfill a month of launch posts
---

# Launch Post — DISABLED

The automated launch-post pipeline was turned off on 2026-10-13. The generated
`content: Launch post — ...` PRs were no longer being merged, and the open
backlog was closed at the same time.

## What to do when this skill is invoked

Stop. Do not do any of the following:

- Do not scan the changelog or triage entries.
- Do not research backing PRs or draft an article.
- Do not create a branch, commit, push, or open a pull request.
- Do not post to Slack.

Reply with one sentence: the launch-post generator is turned off, and point at
this file.

If a scheduled routine invoked this skill, the routine itself should be
disabled at https://claude.ai/code/routines so it stops firing.

## Re-enabling

The previous triage bar, modes, and workflow are in git history (see the
commit that introduced this file). The article guide in
`references/launch-article-guide.md` is kept as a reference for hand-written
launch posts.

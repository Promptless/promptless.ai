---
id: cuj-screenshots
type: cuj
title: Set up automated screenshot capture and updates
personas: [persona-scaleup-solo-writer, persona-enterprise-docs-lead, persona-eng-docs-owner, persona-oss-maintainer, persona-devrel-owner]
trigger: "A UI/label change just invalidated dozens of screenshots and the team is recapturing them by hand."
entry_point: /docs/how-to-use-promptless/using-promptless-capture
success_criteria: "Screenshots in docs are captured and refreshed automatically on UI changes, including behind auth and on firewalled/test environments, with correct annotations."
steps:
  - { stage: "Understand Promptless Capture", doc: /docs/how-to-use-promptless/using-promptless-capture, exists: true }
  - { stage: "Authenticate to the app being captured", doc: "/docs/how-to-use-promptless/using-promptless-capture#authentication", exists: partial, note: "Auth-to-target-app failures reported by one customer; firewalled instances blocked for another" }
  - { stage: "Capture on test/staging environments", doc: "/docs/how-to-use-promptless/using-promptless-capture#environments", exists: partial }
  - { stage: "Control annotations (color, callouts)", doc: "/docs/how-to-use-promptless/using-promptless-capture#annotations", exists: partial, note: "Annotation color gap raised by one customer" }
---

# CUJ: Set up automated screenshot capture and updates

**Scope:** Standing up and tuning automated screenshots. **The most-requested single capability
across paid segments.**

**Trigger.** A UI or label change just made dozens of screenshots wrong, and someone faces
manual recapture — a pain named across many accounts, one with hundreds of stale shots.

**Narrative.** Screenshots are both a top activation hook and a top source of friction. Teams
want capture to "just work," but the corpus surfaces concrete blockers: **authentication to the
target app** (one customer's screenshot auth failed), **firewalled/private instances** that the
capture agent can't reach (another customer), **environment selection** (capture on staging before
release), and **annotation control** (color/callout gaps). Getting screenshots working is
frequently the difference between an engaged pilot and a stalled one.

**Current friction / gap.** Promptless Capture is documented, but auth-to-target, firewalled
environments, environment selection, and annotation controls are under-specified relative to
how often they block teams.

---
id: cuj-release-notes
type: cuj
title: Generate release notes and changelogs from change signal
personas: [persona-eng-docs-owner, persona-scaleup-solo-writer, persona-enterprise-docs-lead]
trigger: "The product ships continuously but there's no reliable release-notes/changelog process; updates go unannounced."
entry_point: /docs/configuring-promptless/triggers/git-hub-p-rs
success_criteria: "Release notes / changelog entries are drafted automatically from PRs (and Slack/Jira context) on the team's cadence, published after release."
steps:
  - { stage: "Trigger on merged PRs", doc: /docs/configuring-promptless/triggers/git-hub-p-rs, exists: true }
  - { stage: "Pull the 'why' from Slack/Jira/Linear", doc: /docs/configuring-promptless/context-sources, exists: true }
  - { stage: "Draft release notes / changelog", doc: "/docs/how-to-use-promptless/release-notes", exists: false, note: "[GAP] No release-notes use-case page despite recurring demand" }
  - { stage: "Time publication to release", doc: "/docs/configuring-promptless/release-timing", exists: false, note: "[GAP] shared with cuj-calibrate-suggestions" }
---

# CUJ: Generate release notes and changelogs from change signal

**Scope:** Producing release notes / changelog entries from the same change signal Promptless
already watches.

**Trigger.** A team ships continuously with **no release-notes process** — changes (including
GA promotions and flag flips) go unannounced. Named explicitly by some customers (one wanted
weekly notes from PRs/Slack); another struggled with drafting notes too early.

**Narrative.** Release notes are a distinct, high-demand output that reuses the trigger +
context-source machinery. The hard parts are pulling the *why* (not just the diff) and timing
publication to the actual release, not the merge.

**Current friction / gap.** **No release-notes use-case page exists.** This is a clear content
gap given how often it surfaces, and it shares the unresolved **release-timing** dependency
with [cuj-calibrate-suggestions](cuj-calibrate-suggestions.md).

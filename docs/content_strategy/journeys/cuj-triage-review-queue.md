---
id: cuj-triage-review-queue
type: cuj
title: Triage and review the suggestion queue
personas: [persona-eng-docs-owner, persona-scaleup-solo-writer, persona-enterprise-docs-lead, persona-devrel-owner, persona-oss-maintainer]
trigger: "Suggestions are flowing; someone needs to review, edit, approve, and—critically—own clearing the queue."
entry_point: /docs/how-to-use-promptless/using-the-web-interface
success_criteria: "Suggestions are reviewed and merged on a sustainable cadence, with clear ownership/assignment so the queue doesn't pile up unattended."
steps:
  - { stage: "See the queue / inbox", doc: /docs/how-to-use-promptless/using-the-web-interface, exists: true }
  - { stage: "Review & edit a drafted PR", doc: /docs/how-to-use-promptless/interacting-with-promptless-p-rs, exists: true }
  - { stage: "Assign an owner / auto-assign", doc: "/docs/how-to-use-promptless/assigning-and-routing-suggestions", exists: false, note: "[GAP] Auto-assignment is the #1 ask of engineer-owned teams" }
  - { stage: "Review from Slack/Teams", doc: /docs/how-to-use-promptless/working-with-slack, exists: true }
  - { stage: "Give feedback to improve future drafts", doc: /docs/how-to-use-promptless/providing-feedback, exists: true }
---

# CUJ: Triage and review the suggestion queue

**Scope:** The recurring operational loop after calibration — review, edit, approve, and own
the queue. Most acute for teams with no dedicated writer.

**Trigger.** Suggestions are flowing and someone must process them sustainably.

**Narrative.** The dominant failure mode for [persona-eng-docs-owner](../personas/eng-docs-owner.md):
**"no one owns the queue."** One customer explicitly needed auto-assignment and an inbox so engineers
would clear suggestions; another's new sole writer inherited a multi-item backlog and needed a
triage routine; diffuse review/approval ownership stalls throughput. Solo writers want a fast
triage loop; engineer-owned teams want work *pushed and assigned* to them, not pulled.

**Current friction / gap.** The web interface and PR-interaction pages exist, but there is
**no documented assignment/routing/auto-assign workflow** — the single most-requested capability
from engineer-owned accounts and a continuity risk when a champion leaves.

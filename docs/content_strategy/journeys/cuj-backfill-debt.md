---
id: cuj-backfill-debt
type: cuj
title: Pay down existing docs debt with Deep Analysis
personas: [persona-enterprise-docs-lead, persona-eng-docs-owner, persona-oss-maintainer, persona-scaleup-solo-writer, persona-devrel-owner, persona-brownfield-docs-lead]
trigger: "Large mature areas are undocumented, stale, or scattered; go-forward drafting alone won't catch up."
entry_point: /docs/how-to-use-promptless/deep-analysis
success_criteria: "Targeted backfill of a mature/undocumented area produces a batch of accurate drafts that close known gaps, without flooding the normal queue."
steps:
  - { stage: "Understand Deep Analysis vs go-forward suggestions", doc: /docs/how-to-use-promptless/deep-analysis, exists: true }
  - { stage: "Scope a one-off / per-section backfill task", doc: "/docs/how-to-use-promptless/deep-analysis#scoping-a-task", exists: partial }
  - { stage: "Provide context for areas code can't explain", doc: /docs/configuring-promptless/context-sources, exists: true }
  - { stage: "Review the batch without overwhelming the queue", doc: /docs/how-to-use-promptless/interacting-with-promptless-p-rs, exists: true }
---

# CUJ: Pay down existing docs debt with Deep Analysis

**Scope:** Catching up on accumulated debt in mature areas, distinct from ongoing
change-driven drafting. Specifically about **gaps / undocumented areas**; for fixing content
that *already exists but is stale/inconsistent*, see the brownfield journey
[cuj-remediate-legacy-content](cuj-remediate-legacy-content.md).

**Trigger.** A team confronts a backlog — undocumented integrations, legacy base APIs, thin or
scattered content — that go-forward drafting will never reach.

**Narrative.** Many accounts split work into two modes: keep up with new changes *and* backfill
the old. One customer ran **per-section deep-analysis rewrites**; another needed to batch-update huge
gaps in legacy base APIs; a third had low-reliability scattered docs to fill. The key tension is
doing this **without flooding the normal review queue** — backfill is a deliberate, scoped
campaign, not a firehose.

**Current friction / gap.** Deep Analysis is documented, but **scoping a bounded backfill task**
(per-section, per-area) and keeping its output separate from the day-to-day queue are
under-specified.

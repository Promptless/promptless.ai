---
id: cuj-evaluate-pilot
type: cuj
title: Evaluate Promptless and run a pilot
personas: [persona-scaleup-solo-writer, persona-eng-docs-owner, persona-enterprise-docs-lead, persona-devrel-owner]
trigger: "Docs are slipping behind eng velocity; a champion wants to test whether Promptless helps before committing."
entry_point: /docs/getting-started/welcome
success_criteria: "Within the first session(s), Promptless surfaces a real change the team missed and drafts a usable doc PR the champion would merge."
steps:
  - { stage: "Understand the model", doc: /docs/getting-started/core-concepts, exists: true }
  - { stage: "Scope the pilot", doc: /docs/getting-started/pilot-overview, exists: true }
  - { stage: "Connect a repo & sources", doc: /docs/getting-started/setup-quickstart, exists: true }
  - { stage: "See first suggestions", doc: /docs/how-to-use-promptless/using-the-web-interface, exists: true }
  - { stage: "Judge & give feedback on quality", doc: /docs/how-to-use-promptless/providing-feedback, exists: true }
  - { stage: "Define what 'success' means for this pilot", doc: "/docs/getting-started/pilot-overview#defining-success", exists: partial, note: "Pilot success criteria / exit metrics not explicit" }
---

# CUJ: Evaluate Promptless and run a pilot

**Scope:** The first-run evaluation journey common to nearly every account. Ends when the
champion has enough signal to advocate internally; expansion and procurement are downstream.

**Trigger.** A champion (solo writer, eng owner, docs lead, or DevRel) feels docs slipping and
wants proof Promptless helps before committing time or budget.

**Narrative.** The make-or-break moment is **time-to-first-useful-suggestion.** Across calls,
champions decided based on whether the first batch caught something real they'd have missed and
drafted something they'd actually merge — one customer's docs owner rated suggestions "7–8 vs
our 4–5"; another's sole writer rated the first batch 8/10. Conversely, a noisy or empty first batch (e.g.
an expired token producing zero suggestions) stalls the evaluation. Pilots also need an
explicit definition of success and an exit metric, which the corpus shows is often left vague.

**Current friction / gap.** "What does a good pilot look like and how is it measured" is only
partially documented; enterprise buyers especially want a crisp pilot success rubric.

---
id: persona-scaleup-solo-writer
type: persona
name: "Sam — Lead / Solo Technical Writer"
audience: aud-scaleup-docs-team
role: Sole or lead technical writer (often reporting into product, support, or eng)
team_context: 1–3 writers at a high-growth commercial SaaS on a docs-as-code stack
proficiency: [git-and-prs, markdown, docs-as-code-ssg, ci-basics]
prerequisites: [git-and-prs, a-docs-as-code-repo]
goals:
  - Stop being reactive — get told what shipped that needs docs
  - Keep up with eng velocity without dropping things
  - Eliminate manual screenshot recapture
  - Demonstrate personal leverage / justify the role
pains:
  - "I'm underwater; things fall through the cracks"
  - No reliable signal of what changed
  - Setup/access friction (tokens, repo scope) silently breaks coverage
  - Tooling lock-in (a hosted docs platform) mid-migration
content_types: [quickstart, triggers-setup, context-sources-setup, review-and-triage, screenshots, notifications, migration-guide, faq]
journeys: [cuj-evaluate-pilot, cuj-connect-sources, cuj-calibrate-suggestions, cuj-triage-review-queue, cuj-screenshots, cuj-migrate-to-docs-as-code, cuj-prove-value]
---

# Persona: Sam — Lead / Solo Technical Writer (scale-up)

**Scope:** The dominant champion/evaluator persona for [aud-scaleup-docs-team](../audiences/scaleup-docs-team.md).

Sam is the only writer (or one of two) at a fast-growing SaaS company. Engineering ships
faster than Sam can track, so docs slip and Sam fears what's falling through the cracks. Sam
already works docs-as-code (or is the one dragging the org onto it) and has zero patience for
heavy setup. Sam is usually both the champion *and* the buyer — adoption turns on how quickly
the first genuinely useful, accurate suggestion appears.

**What Sam needs from docs:** a fast quickstart; clear trigger and context-source setup; the
review/triage loop; screenshots; and migration guidance when moving off a hosted platform.
Self-serve and quick beats comprehensive.

**Success looks like:** within the first session, Promptless surfaces a real change Sam missed
and drafts a usable PR — and Sam can point to merged doc PRs as proof of leverage.

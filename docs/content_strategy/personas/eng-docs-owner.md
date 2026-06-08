---
id: persona-eng-docs-owner
type: persona
name: "Eli — Engineer / Founder who owns docs"
audience: aud-engineer-owned-docs
role: Engineer, eng manager, or founder championing docs with no writer on staff
team_context: startup/mid-market commercial SaaS, docs-as-code, no technical writer
proficiency: [git-and-ci-expert, codebase-deep, weak-editorial-vocab]
prerequisites: [git-and-prs, ci-cd]
goals:
  - Maintain customer-facing docs without hiring a writer
  - Get suggestions auto-assigned and into an inbox someone clears
  - Pay down existing docs debt in bulk
  - Generate release notes from PRs/Slack
pains:
  - No one owns the queue; debt grows silently
  - Day-one noise overwhelms the team
  - Code PRs lack the "why" / full feature picture
  - No release-notes process
content_types: [quickstart, review-and-triage, auto-assignment, deep-analysis, release-notes, suggestion-filtering, api-triggers, providing-feedback]
journeys: [cuj-evaluate-pilot, cuj-calibrate-suggestions, cuj-triage-review-queue, cuj-backfill-debt, cuj-release-notes]
---

# Persona: Eli — Engineer / Founder who owns docs

**Scope:** The champion/owner persona for [aud-engineer-owned-docs](../audiences/engineer-owned-docs.md).

Eli is an engineer (or founder) at a company with no technical writer. Docs are a shared eng
responsibility that no one actually owns, so debt accrues quietly until a customer complains.
Eli is fluent in Git and CI but thinks in code, not editorial process, and wants Promptless to
detect, draft, and ideally **assign** doc work so engineers approve rather than author. Eli is
hypersensitive to noise: a loud first batch against a debt-laden repo will make the team
disengage and the queue will die.

**What Eli needs from docs:** engineer-framed setup; the review/triage loop with
**auto-assignment**; Deep Analysis for debt paydown; release-notes generation; and clear
noise/relevance tuning — all assuming no writer exists.

**Success looks like:** a tuned, low-noise queue with owners auto-assigned, mature areas
backfilled by Deep Analysis, and release notes generated without anyone writing them by hand.

---
id: cuj-migrate-to-docs-as-code
type: cuj
title: Migrate off a hosted/legacy platform to docs-as-code
personas: [persona-scaleup-solo-writer, persona-enterprise-docs-lead, persona-devrel-owner, persona-eng-docs-owner, persona-brownfield-docs-lead]
trigger: "The team is on a hosted or legacy platform (Doc360, ReadMe, Fern, HubSpot, RoboHelp) that blocks adoption, and wants to move to docs-as-code to use Promptless."
entry_point: /docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code
success_criteria: "Docs are migrated to a Git-based docs-as-code stack Promptless supports, with content, structure, and redirects intact."
steps:
  - { stage: "Confirm docs-as-code is the prerequisite", doc: /docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code, exists: true }
  - { stage: "Choose a target SSG (Mintlify, Starlight, VitePress)", doc: "/docs/migrations/choosing-a-platform", exists: false, note: "[GAP] No migration guidance" }
  - { stage: "Migrate from a specific source platform", doc: "/docs/migrations/from-doc360", exists: false, note: "[GAP] Doc360/ReadMe/Fern/HubSpot/RoboHelp all named; none documented" }
  - { stage: "Preserve URLs / redirects", doc: "/docs/migrations/redirects", exists: false, note: "[GAP]" }
---

# CUJ: Migrate off a hosted/legacy platform to docs-as-code

**Scope:** The frequent *on-ramp* journey: getting onto a Git-based stack so Promptless can be
used at all. Docs-as-code is a hard product prerequisite.

**Trigger.** The team is locked into or frustrated by a hosted/legacy platform that blocks
Promptless: Doc360 (where Promptless dropped support), ReadMe, Fern (post-acquisition collapse),
HubSpot, RoboHelp. Many explicitly treat the migration as part of adopting Promptless (a
Starlight migration offer surfaced repeatedly).

**Narrative.** Prospects often *want* Promptless but can't use it until they leave their current
platform. The journey: confirm the prerequisite, pick a supported SSG, migrate content from a
named source platform, and preserve URLs/redirects. This is as much a sales-unblocking journey
as a usage one.

**Current friction / gap.** **No migration content exists at all** — not platform selection,
not per-source guides, not redirect handling. Given how many deals hinge on it, this is a
high-leverage gap.

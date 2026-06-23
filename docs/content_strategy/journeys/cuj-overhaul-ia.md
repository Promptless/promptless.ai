---
id: cuj-overhaul-ia
type: cuj
title: Restructure the information architecture of an existing doc set
personas: [persona-brownfield-docs-lead, persona-enterprise-docs-lead]
trigger: "The doc set's navigation/structure reflects an older product shape and no longer maps to how the product or its users work."
entry_point: /docs/configuring-promptless/doc-collections/how-promptless-learns-your-docs
success_criteria: "The corpus is reorganized into an IA that matches today's product (e.g. capability-based), with content moved/merged/retitled and URLs preserved — without losing or stranding pages."
steps:
  - { stage: "Map the current corpus & its structure", doc: "/docs/how-to-use-promptless/content-audit", exists: false, note: "[GAP] shared with cuj-remediate-legacy-content" }
  - { stage: "Design the target IA (e.g. capability-based)", doc: "/docs/how-to-use-promptless/restructuring-your-docs", exists: false, note: "[GAP] one customer's capability-based 'v3.0' rebuild; another's template/IA refactor" }
  - { stage: "Move, merge, and retitle pages into the new IA", doc: "/docs/how-to-use-promptless/restructuring-your-docs#executing", exists: false, note: "[GAP]" }
  - { stage: "Preserve URLs / redirects", doc: "/docs/migrations/redirects", exists: false, note: "[GAP] shared with cuj-migrate-to-docs-as-code" }
  - { stage: "Keep new content flowing into the new structure", doc: /docs/configuring-promptless/doc-collections/how-promptless-learns-your-docs, exists: true }
---

# CUJ: Restructure the information architecture of an existing doc set

**Scope:** A larger, less frequent brownfield journey: reorganizing the *structure* of an
existing corpus, not just fixing individual pages. Distinct from
[cuj-remediate-legacy-content](cuj-remediate-legacy-content.md) (page-level health) and from
[cuj-migrate-to-docs-as-code](cuj-migrate-to-docs-as-code.md) (changing platform).

**Trigger.** The navigation reflects an older product shape. One customer wanted a
**capability-based IA rebuild ("v3.0")**; another carried a **big template/IA refactor
backlog**; a third needed to **unify two divergent doc structures** as the product went SaaS.

**Narrative.** The team audits the current corpus, designs a target IA that matches the product
as it is now, then **moves, merges, and retitles** pages into it while preserving URLs — and
ensures new content keeps flowing into the new structure rather than the old. This is the
docs-team equivalent of a refactor: high value, high risk, easy to strand pages or break links.

**Current friction / gap.** Promptless can learn an existing docs structure, but there is **no
guidance for restructuring one** — no content map, no target-IA design, no move/merge execution,
and redirect handling is the same gap migration faces. (This very `docs/content_strategy/` exercise is
an example of the upstream thinking such an overhaul requires.)

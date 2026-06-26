---
id: cuj-multi-repo-routing
type: cuj
title: Route changes across many repos and versioned docs
personas: [persona-enterprise-docs-lead, persona-oss-maintainer, persona-devrel-owner, persona-scaleup-solo-writer, persona-brownfield-docs-lead]
trigger: "Changes span many code repos and must land in the right docs repo, collection, and version."
entry_point: /docs/configuring-promptless/doc-collections/how-promptless-learns-your-docs
success_criteria: "A change in any of N code repos is correctly routed to the right docs collection and the right versioned docs set, with no cross-routing errors."
steps:
  - { stage: "Define doc collections", doc: /docs/configuring-promptless/doc-collections/how-promptless-learns-your-docs, exists: true }
  - { stage: "Map code repos → docs locations", doc: /docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code, exists: true }
  - { stage: "Route across multiple repos / monorepo vs many", doc: "/docs/configuring-promptless/doc-collections/multi-repo-routing", exists: false, note: "[GAP] one customer hit a cross-collection routing/memory bug; no routing page" }
  - { stage: "Handle versioned docs (v3 vs v4)", doc: "/docs/configuring-promptless/doc-collections/versioned-docs", exists: false, note: "[GAP] Versioned-docs mapping requested by OSS + enterprise" }
---

# CUJ: Route changes across many repos and versioned docs

**Scope:** Correctly directing change signal in multi-repo and multi-version environments —
the structural reality for enterprise and OSS accounts.

**Trigger.** Code lives in many repos (some customers span 6+ GitHub orgs or 16–20 eng teams)
and docs span multiple collections and versions; a change must land in exactly the right place.

**Narrative.** Two related problems. **Routing**: one customer hit a cross-collection
routing/memory bug; large orgs need deterministic mapping of code repos to docs collections.
**Versioning**: some customers needed changes mapped to the correct versioned docs set
(e.g. v3 vs v4), and enterprise teams maintain parallel versions. Mis-routing erodes trust fast.

**Current friction / gap.** Doc-collections basics are documented, but **multi-repo routing and
versioned-docs mapping have no dedicated pages** — a structural gap for the two segments with
the most repos.

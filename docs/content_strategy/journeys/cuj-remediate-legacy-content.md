---
id: cuj-remediate-legacy-content
type: cuj
title: Audit and remediate legacy content at scale
personas: [persona-brownfield-docs-lead, persona-enterprise-docs-lead]
trigger: "A large existing corpus is full of stale, inconsistent, off-template, or contradictory pages that no one can audit by hand."
entry_point: /docs/how-to-use-promptless/deep-analysis
success_criteria: "Existing pages are audited, then updated/consolidated/restandardized in reviewable batches so corpus freshness and consistency measurably improve — without a manual rewrite or a noise flood."
steps:
  - { stage: "Audit the corpus for staleness/inconsistency", doc: "/docs/how-to-use-promptless/content-audit", exists: false, note: "[GAP] No way to surface stale/contradictory existing pages at scale (one enterprise's ~4k-page long tail; another's debt-as-noise)" }
  - { stage: "Run Deep Analysis over an existing area", doc: /docs/how-to-use-promptless/deep-analysis, exists: true }
  - { stage: "Update & consolidate stale/duplicate pages", doc: "/docs/how-to-use-promptless/remediating-existing-pages", exists: false, note: "[GAP] Remediation of EXISTING pages (vs backfilling gaps) not documented" }
  - { stage: "Retrofit current standards & templates", doc: "/docs/how-to-use-promptless/standards-enforcement", exists: false, note: "[GAP] Off-style/off-template legacy content; unify divergent processes" }
  - { stage: "Process the batch without flooding the live queue", doc: /docs/how-to-use-promptless/interacting-with-promptless-p-rs, exists: true }
---

# CUJ: Audit and remediate legacy content at scale

**Scope:** Bringing an **existing** brownfield corpus back to health — auditing, updating,
consolidating, and restandardizing pages that already exist. The complement to
[cuj-backfill-debt](cuj-backfill-debt.md): backfill fills *gaps/undocumented* areas; this
journey fixes *content that exists but is stale, inconsistent, or off-standard.*

**Trigger.** A docs lead confronts a large corpus where most pages are quietly out of date,
contradictory, or off-template, and manual auditing is impossible at the scale — one enterprise
with ~4k pages and long-tail staleness, another with legacy base APIs, a third unifying two
divergent legacy processes, and others carrying legacy off-style content.

**Narrative.** The work is a deliberate campaign, not a firehose: **find** the stale/inconsistent
pages, **remediate** them (update, consolidate duplicates, restandardize to current
templates/style), and do it in **reviewable batches** that don't drown the live change queue.
The brownfield trust concern is acute — turning a tool loose on a debt-laden corpus must
*reduce* the felt debt, not amplify it with noise.

**Current friction / gap.** Deep Analysis exists, but there is **no content-audit, no
existing-page-remediation, and no standards-enforcement content.** Today's docs assume
go-forward drafting and gap-backfilling; remediating an *existing* corpus at scale is the
brownfield-specific gap.

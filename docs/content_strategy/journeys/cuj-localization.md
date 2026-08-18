---
id: cuj-localization
type: cuj
title: Keep translations current across locales
personas: [persona-oss-maintainer, persona-enterprise-docs-lead, persona-devrel-owner]
trigger: "Source docs change but translated/localized versions fall months or years behind."
entry_point: /docs/configuring-promptless/doc-collections/how-promptless-learns-your-docs
success_criteria: "When source docs change, the corresponding localized versions are updated (or flagged for update) per locale, integrating with the team's TMS where one exists."
steps:
  - { stage: "Model localized docs as collections/locales", doc: "/docs/configuring-promptless/doc-collections/localization", exists: false, note: "[GAP] No localization page" }
  - { stage: "Propagate source changes to each locale", doc: "/docs/configuring-promptless/localization/propagation", exists: false, note: "[GAP] one OSS project's translations years behind; others needed locale upkeep" }
  - { stage: "Integrate with a TMS (e.g. Phrase)", doc: "/docs/integrations/tms", exists: false, note: "[GAP] one enterprise team requires a TMS hook" }
  - { stage: "Human-review machine translations", doc: /docs/how-to-use-promptless/providing-feedback, exists: partial }
---

# CUJ: Keep translations current across locales

**Scope:** Maintaining localized/translated docs in sync with source — a real need for OSS
projects with community translations and enterprise teams with localization functions.

**Trigger.** Source docs change; translations lag badly (one OSS project's translations were
"years behind"; others needed locale upkeep; one enterprise team was accelerating Japanese
localization; another needed its Translation Management System integrated).

**Narrative.** Localization is a recurring secondary journey, strongest in OSS and enterprise.
Teams want source changes to **propagate to each locale** (or at least flag the locale as
stale) and, where a Translation Management System exists, to **hook into it** rather than bypass
it. Machine translation is distrusted, so human review must stay in the loop.

**Current friction / gap.** **Localization is entirely undocumented** — no locale-modeling,
propagation, or TMS-integration content exists. A clear gap for two priority segments.

---
id: cuj-prove-value
type: cuj
title: Demonstrate docs-team value and ROI to leadership
personas: [persona-scaleup-solo-writer, persona-enterprise-docs-lead, persona-devrel-owner, persona-eng-docs-owner, persona-brownfield-docs-lead]
trigger: "The champion needs to show leadership that Promptless (and the docs function) delivers measurable leverage—to justify spend, headcount, or the role itself."
entry_point: /docs/how-to-use-promptless/using-the-web-interface
success_criteria: "The champion can report concrete outcomes—doc PRs merged, coverage/freshness gains, time saved—drawn from Promptless, in a form leadership accepts."
steps:
  - { stage: "See activity (PRs drafted/merged, coverage)", doc: /docs/how-to-use-promptless/using-the-web-interface, exists: partial, note: "Activity visible; reporting/metrics view unclear" }
  - { stage: "Quantify impact (time saved, freshness, % of doc PRs)", doc: "/docs/how-to-use-promptless/reporting-and-roi", exists: false, note: "[GAP] one customer cited Promptless as ~40% of doc PRs—no built-in reporting page" }
  - { stage: "Export / share results with leadership", doc: "/docs/how-to-use-promptless/reporting-and-roi#sharing", exists: false, note: "[GAP]" }
---

# CUJ: Demonstrate docs-team value and ROI to leadership

**Scope:** The "make the case upward" journey. Cuts across champions who must justify spend,
headcount, or their own role as orgs automate around docs.

**Trigger.** Leadership wants proof. One customer's head of customer education wanted to **prove
docs-team efficiency before adding headcount**; another needed a case to **expand** after the
champion left; a third could point to Promptless authoring **~40% of doc PRs**; another's
management literally asked to "automate the job away."

**Narrative.** Champions need outcome data — PRs drafted/merged, coverage and freshness gains,
time saved, share of doc PRs automated — in a form they can present. Today they reconstruct
this manually from activity views.

**Current friction / gap.** There is **no reporting/ROI view or page.** Given that value-proof
gates both expansion and (for some) the champion's job security, a reporting capability + doc is
a high-leverage gap.

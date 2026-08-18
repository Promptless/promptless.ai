---
id: cuj-agent-friendly-docs
type: cuj
title: Make docs accurate and discoverable for AI agents
personas: [persona-devrel-owner, persona-enterprise-docs-lead, persona-oss-maintainer, persona-scaleup-solo-writer]
trigger: "AI coding agents are a primary docs consumer, but the docs aren't discoverable (no llms.txt) or accurate enough for agents to implement the product correctly."
entry_point: /docs/configuring-promptless/doc-collections/doc-detective-integration
success_criteria: "Docs expose agent-friendly artifacts (e.g. llms.txt) and code examples are validated, so AI agents recommend and correctly implement the product."
steps:
  - { stage: "Validate code examples (Doc Detective)", doc: /docs/configuring-promptless/doc-collections/doc-detective-integration, exists: true }
  - { stage: "Generate agent-friendly artifacts (llms.txt)", doc: "/docs/how-to-use-promptless/agent-friendly-docs", exists: false, note: "[GAP] llms.txt / agent-discoverability requested by several customers" }
  - { stage: "Keep SDK/API reference accurate", doc: "/docs/how-to-use-promptless/sdk-api-accuracy", exists: false, note: "[GAP] No SDK/API-accuracy use-case page" }
  - { stage: "Treat doc feedback as a trigger", doc: /docs/configuring-promptless/triggers, exists: partial, note: "one customer wanted to trigger off doc feedback" }
---

# CUJ: Make docs accurate and discoverable for AI agents

**Scope:** Optimizing docs for AI-agent consumption — accuracy *and* discoverability. Primary
for DevRel/DevEx, increasingly raised by everyone.

**Trigger.** Teams recognize agents now read their docs: some customers wanted docs "accurate
and complete so agents recommend and correctly implement the SDK"; others wanted docs
"agent-friendly" or flagged API-reference accuracy "for AI agents"; still others raised
discoverability.

**Narrative.** This journey has two halves. **Discoverability** — exposing `llms.txt` and
agent-readable structure so agents can find and use the docs. **Accuracy** — validating code
examples (Doc Detective is the existing, resonant artifact) and keeping SDK/API reference
correct so agents don't implement the product wrong. It's the newest journey in the corpus and
trending upward.

**Current friction / gap.** Doc Detective integration exists, but **agent-friendliness/`llms.txt`
and SDK/API-accuracy have no pages** — a forward-looking gap aligned with where the market is
moving (and with Promptless's own positioning).

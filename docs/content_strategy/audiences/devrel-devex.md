---
id: aud-devrel-devex
type: audience
segment: DevRel / DevEx owner of developer-facing docs
maturity: startup-to-enterprise
docs_owner: a developer advocate or DevEx/DevX engineer who owns docs alongside other duties
firmographics: [developer-tools, api-first, sdk-heavy, commercial-or-oss]
relationship_stages: [prospect, customer]
personas: [persona-devrel-owner]
features_emphasized: [sdk-api-docs, agent-friendliness, llms-txt, code-example-validation, discoverability, style-enforcement, cross-repo-triggers]
---

# Audience: DevRel / DevEx owner

**Scope:** Developer-relations or developer-experience owners at API-first / SDK-heavy
products who own developer docs as *part* of a broader role (advocacy, DevEx tooling,
technical marketing). Differs from [aud-scaleup-docs-team](scaleup-docs-team.md) in that the
owner is not a technical writer and optimizes for **developer + AI-agent consumption**, not
editorial throughput.

## Who they are

DevRel/DevEx engineers and developer advocates at dev-tool companies. Examples span
error-monitoring, commerce-framework, and AI/LLM-tooling products, plus several smaller
dev-tool SaaS. They care about the developer journey
through SDK/API reference and guides, and they're acutely aware that **AI coding agents are
now a primary docs consumer**.

## What they're trying to do

Keep large, fast-moving SDK/API docs accurate while spending their own time on advocacy and
DevEx — and make docs **discoverable and trustworthy to AI agents** (so agents recommend and
correctly implement the product). Several have built a homegrown AI/GitHub-Action docs script
and want to retire it for something reliable.

## Defining pains

- **Surface area too large to chase:** multi-SDK, multi-language reference goes stale faster
  than one advocate can track; constant "this is wrong/outdated" feedback.
- **Accuracy for agents:** docs aren't discoverable or structured for agents (no `llms.txt`);
  inaccurate reference makes agents implement the SDK wrong.
- **Homegrown automation is unreliable:** their own scripts take input at face value and
  produce errors; they want validated accuracy (code-example testing resonates).
- **Style consistency** across docs and technical marketing copy.

## Buying constraints

- Champion is technical and evaluates on **accuracy and cross-repo trigger fidelity**; light
  procurement unless inside a larger enterprise.
- Will benchmark against building it themselves — differentiation must be clear.

## Qualified reader (for docs targeting)

- **Prerequisites they bring:** strong API/SDK and Git fluency; thinks in terms of developer
  and agent consumers.
- **Subject dependencies:** need agent-friendliness/`llms.txt`, code-example validation
  (code-example testing), SDK/API accuracy, and cross-repo triggers documented explicitly.

---
id: persona-devrel-owner
type: persona
name: "Devon — DevRel / DevEx Owner"
audience: aud-devrel-devex
role: Developer advocate or DevEx/DevX engineer who owns docs alongside other duties
team_context: API-first / SDK-heavy dev-tool company (commercial or open-core)
proficiency: [api-and-sdk-expert, git, thinks-in-developer-and-agent-consumers]
prerequisites: [git-and-prs, api-sdk-fluency]
goals:
  - Keep large SDK/API docs accurate while focusing on advocacy/DevEx
  - Make docs discoverable and trustworthy to AI coding agents
  - Retire an unreliable homegrown AI docs script
  - Enforce style across docs and technical marketing
pains:
  - SDK/API surface too large to chase; constant stale/wrong reports
  - Docs not structured for agents (no llms.txt); agents implement SDK wrong
  - Homegrown automation takes input at face value and errors
  - Style drift across docs + marketing copy
content_types: [sdk-api-reference-accuracy, agent-friendliness-llms-txt, code-example-validation, cross-repo-triggers, style-enforcement, quickstart]
journeys: [cuj-evaluate-pilot, cuj-connect-sources, cuj-agent-friendly-docs, cuj-calibrate-suggestions]
---

# Persona: Devon — DevRel / DevEx Owner

**Scope:** The owner/evaluator persona for [aud-devrel-devex](../audiences/devrel-devex.md).

Devon is a developer advocate or DevEx engineer who owns developer docs as one of several
hats. The SDK/API surface is large and fast-moving, so reference goes stale faster than Devon
can chase, and there's a steady drip of "this is wrong" feedback. Devon knows AI coding agents
are now a primary docs consumer and worries the docs aren't discoverable (no `llms.txt`) or
accurate enough for agents to implement the product correctly. Devon has probably already
built a homegrown GitHub-Action docs script that proved unreliable and wants to replace it —
but will benchmark Promptless against building it in-house, so differentiation
(code-example validation, cross-repo fidelity) must be clear.

**What Devon needs from docs:** agent-friendliness/`llms.txt`, code-example validation
(Doc Detective), SDK/API accuracy, and cross-repo triggers — framed for a technical owner.

**Success looks like:** SDK/API docs stay accurate automatically, are agent-discoverable, and
Devon retires the homegrown script with confidence.

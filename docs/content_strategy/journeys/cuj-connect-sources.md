---
id: cuj-connect-sources
type: cuj
title: Connect source control, triggers, and context sources
personas: [persona-scaleup-solo-writer, persona-eng-docs-owner, persona-enterprise-docs-lead, persona-oss-maintainer, persona-devrel-owner]
trigger: "Champion is ready to wire Promptless into their repos and the systems where change signal lives."
entry_point: /docs/getting-started/setup-quickstart
success_criteria: "Source control connected (with appropriate access scope), triggers firing on real change events, and doc locations resolved — without a silent auth failure."
steps:
  - { stage: "Install source-control app", doc: /docs/integrations/github-integration, exists: true, note: "Also github-enterprise-integration, bitbucket-integration" }
  - { stage: "Choose access scope (read-only / repo selection)", doc: "/docs/integrations/github-integration#permissions-and-scope", exists: partial, note: "Access-scope guidance scattered; OSS read-only path lives elsewhere" }
  - { stage: "Configure triggers", doc: /docs/configuring-promptless/triggers, exists: true, note: "PRs, commits, issues, Slack, Intercom, Teams, API" }
  - { stage: "Connect context sources", doc: /docs/configuring-promptless/context-sources, exists: true, note: "Jira, Linear, Notion, Confluence" }
  - { stage: "Tell Promptless where docs live", doc: /docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code, exists: true }
  - { stage: "Verify the connection is live (no expired token)", doc: "/docs/configuring-promptless/connection-health", exists: false, note: "[GAP] No troubleshooting page for silent auth/token failures" }
---

# CUJ: Connect source control, triggers, and context sources

**Scope:** Wiring Promptless into the systems where change signal originates. The commercial
on-ramp; OSS has its own variant ([cuj-oss-onboarding](cuj-oss-onboarding.md)).

**Trigger.** The champion is ready to connect repos and the tools (Jira, Linear, Slack, etc.)
that carry the "why" behind changes.

**Narrative.** This is the step where pilots silently die. One customer ran with **zero suggestions
because of an expired GitLab token**; others hit repo-scoping confusion or needed read-only
access for public repos only. Context sources matter as much as triggers — engineers' code PRs
"lack the full feature picture and the why," so connecting Jira/Linear/Slack is what makes
drafts good.

**Current friction / gap.** Access-scope decisions (read-only vs write, repo selection,
public-only) are scattered, and there is **no connection-health / silent-failure
troubleshooting page** — the single most damaging gap because failures are invisible.

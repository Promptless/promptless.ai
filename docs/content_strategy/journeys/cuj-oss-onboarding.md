---
id: cuj-oss-onboarding
type: cuj
title: Onboard an open-source project on the free program
personas: [persona-oss-maintainer, persona-devrel-owner]
trigger: "An OSS maintainer wants Promptless on their project via the free OSS program."
entry_point: /docs/getting-started/promptless-oss
success_criteria: "The project is connected via a read-only app across its repos, with doc updates auto-drafted for changes contributors skipped — at no cost to the project."
steps:
  - { stage: "Understand the OSS program & eligibility", doc: /docs/getting-started/promptless-oss, exists: true }
  - { stage: "Install the read-only GitHub app", doc: "/docs/integrations/github#read-only-oss", exists: partial, note: "Read-only/public-repo path under-documented vs commercial install" }
  - { stage: "Connect multiple project repos", doc: /docs/configuring-promptless/doc-collections/git-hub-repos-docs-as-code, exists: true }
  - { stage: "Route across versions (see multi-repo-routing)", doc: cuj-multi-repo-routing, exists: ref }
  - { stage: "Set up localization (see localization)", doc: cuj-localization, exists: ref }
---

# CUJ: Onboard an open-source project on the free program

**Scope:** The open-source on-ramp — the OSS variant of
[cuj-connect-sources](cuj-connect-sources.md). Strategic for brand/community (recognizable
foundation/project logos), not revenue.

**Trigger.** A maintainer of a well-known open-source project wants Promptless on
their project via the free program.

**Narrative.** Onboarding differs from commercial in three ways: it uses a **read-only GitHub
app** (maintainers grant access to public repos only), governance is **diffuse** (no single
decision-maker to approve), and the project is usually **multi-repo and versioned** from day
one, often with **localization** needs. The promise that resonates: catch the doc updates
contributors skip, so maintainers spend time on code.

**Current friction / gap.** The OSS program page exists, but the **read-only/public-repo install
path** is under-documented relative to the commercial install, and it depends on the
multi-repo-routing and localization gaps flagged elsewhere.

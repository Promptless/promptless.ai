---
id: persona-oss-maintainer
type: persona
name: "Mara — OSS Maintainer"
audience: aud-oss-maintainer
role: Project maintainer / core contributor (sometimes a volunteer docs lead)
team_context: community or foundation OSS project (often cloud-native-foundation-adjacent), free OSS program
proficiency: [git-and-oss-workflow-expert, multi-repo, versioning, sometimes-i18n]
prerequisites: [git-and-prs, public-repo-access]
goals:
  - Keep project docs accurate as the code moves fast
  - Stop backfilling for contributors who skip doc PRs
  - Route changes to the right repo and versioned docs set
  - Keep translations from falling years behind
  - (SDK/protocol) be accurate enough that AI agents implement it correctly
pains:
  - Contributors don't write docs
  - Multi-repo, multi-version routing is fiddly
  - Localization runs months/years behind
  - Docs are thin/scattered and need backfill
content_types: [oss-program-onboarding, read-only-app-setup, multi-repo-routing, versioned-docs, localization, code-example-validation, agent-friendliness]
journeys: [cuj-oss-onboarding, cuj-multi-repo-routing, cuj-localization, cuj-backfill-debt, cuj-agent-friendly-docs]
---

# Persona: Mara — OSS Maintainer

**Scope:** The maintainer persona for [aud-oss-maintainer](../audiences/oss-maintainer.md).

Mara maintains an open-source project and inherits the docs burden because contributors merge
code but skip the doc PRs. She's an expert in Git and multi-repo OSS workflows, manages
versioned docs, and often juggles community translations that lag badly. She's adopting
Promptless through the **free OSS program**, so there's no procurement — but she does need a
**read-only GitHub app** and the comfort to grant access to public repos, and governance is
diffuse (no single owner to say yes). For SDK/protocol projects she also wants docs accurate
enough that AI coding agents recommend and correctly implement the project.

**What Mara needs from docs:** OSS-program onboarding, read-only app setup, multi-repo +
versioned-docs routing, localization, and code-example validation — documented for a
community context.

**Success looks like:** doc updates auto-drafted for changes contributors forgot, routed to
the right version, with translations kept current — freeing Mara for code.

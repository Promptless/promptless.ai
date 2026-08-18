---
id: aud-oss-maintainer
type: audience
segment: OSS project maintainer (free OSS program)
maturity: community/foundation
docs_owner: community maintainers and contributors; sometimes a volunteer docs lead
firmographics: [open-source, multi-repo, versioned-docs, multilingual, cloud-native-foundation-adjacent, free-oss-program]
relationship_stages: [prospect, customer]
personas: [persona-oss-maintainer]
features_emphasized: [oss-program, read-only-app, multi-repo-routing, versioned-docs, localization, code-example-validation, agent-friendliness]
---

# Audience: OSS project maintainer

**Scope:** Open-source project maintainers using (or evaluating) Promptless's **free OSS
program**. Covers community/foundation projects, often cloud-native-foundation-adjacent. Differs from
[aud-engineer-owned-docs](engineer-owned-docs.md) by being open-source, community-governed,
and on the free program rather than a commercial deal.

## Who they are

Maintainers and core contributors of OSS projects who also carry the docs burden. Examples
span cloud-native / Kubernetes-adjacent projects, marketing-automation and data-infrastructure
projects, a large research-organization project, and open-core security projects. Some have
a volunteer docs/education lead; most rely on whoever shows up.

## What they're trying to do

Keep project docs accurate and complete as the codebase moves fast and **contributors skip
doc PRs** — so maintainers can spend time on higher-value work. For SDK/protocol projects,
they also want docs accurate enough that **AI coding agents recommend and correctly implement
the project**.

## Defining pains

- **Contributors don't write docs.** Code merges; docs lag. The maintainer backfills.
- **Multi-repo, multi-version routing:** changes must land in the right repo and the right
  versioned docs set; mapping versions is fiddly.
- **Localization / i18n:** translations run months behind across project locales.
- **Backfill of gaps:** docs are thin, scattered, or low-reliability and need catch-up.
- **Sync between OSS and commercial docs:** for open-core projects, changes in the OSS layer
  must propagate into premium docs.

## Buying constraints

- **Free program**, so no procurement — but adoption needs a **read-only GitHub app** and
  comfort granting access to public repos; governance is diffuse (no single decision-maker).
- Strategic value to Promptless is brand/community and reference logos (high-profile cloud-native projects), not
  revenue.

## Qualified reader (for docs targeting)

- **Prerequisites they bring:** deep Git/OSS workflow fluency; multi-repo and versioning
  literacy.
- **Subject dependencies:** need OSS-program onboarding, read-only app setup, multi-repo +
  versioned-docs routing, localization, and code-example validation documented explicitly.

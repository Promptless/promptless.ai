---
id: persona-enterprise-docs-lead
type: persona
name: "Dana — Documentation Manager"
audience: aud-enterprise-docs-team
role: Manager/Director of Documentation (also: Digital CX manager, Docs Engineering lead)
team_context: leads 3–50 writers across many products and engineering teams
proficiency: [docs-as-code, ci-release-process, security-compliance-vocab, docs-ops]
prerequisites: [git-and-prs, their-own-release-process]
goals:
  - Keep a large multi-product corpus current without new headcount
  - Scope drafting to actual releases (avoid pre-ship/feature-flag noise)
  - Pass security/self-host/SSO review and procurement
  - Show docs-team efficiency/ROI to leadership
pains:
  - Can't see what changed across many products/repos/orgs
  - AI output trust after an underwhelming in-house pilot
  - Legacy CCMS / mid-migration off hosted platforms
content_types: [conceptual, multi-repo-routing, security-and-self-host, sso, deep-analysis, release-timing-config, localization, admin-and-roles, roi-reporting]
journeys: [cuj-evaluate-pilot, cuj-enterprise-security-review, cuj-multi-repo-routing, cuj-calibrate-suggestions, cuj-prove-value, cuj-migrate-to-docs-as-code]
---

# Persona: Dana — Documentation Manager (enterprise)

**Scope:** The decision-maker/owner persona for [aud-enterprise-docs-team](../audiences/enterprise-docs-team.md).

Dana runs a documentation organization at a large company. Her writers are spread thin across
many products shipped by autonomous eng teams, and leadership keeps the headcount flat while
asking for more. She has likely already run an internal AI experiment that produced
hallucinations and lost the room, so she evaluates output quality skeptically and needs to
forward security/self-host/SSO documentation to IT and procurement before anything ships.

**What she needs from docs:** thorough, forwardable security/self-host/SSO references;
multi-repo routing and release-timing configuration; Deep Analysis for backfilling debt;
localization; and admin/roles content for governing a team. She reads to *evaluate and de-risk*,
not to tinker.

**Success looks like:** a scoped pilot that proves trustworthy, release-timed drafts on a
couple of products, cleared by security, with a story she can tell leadership.

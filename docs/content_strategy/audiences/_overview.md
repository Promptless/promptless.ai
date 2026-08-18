---
id: audiences-overview
type: overview
scope: Target audiences for Promptless, derived from customer & prospect calls (Dec 2025–Jun 2026)
audiences:
  - aud-enterprise-docs-team
  - aud-scaleup-docs-team
  - aud-engineer-owned-docs
  - aud-oss-maintainer
  - aud-devrel-devex
  - aud-brownfield-docs-team
---

# Audiences — Overview

**Scope:** This file indexes the target audiences for Promptless and how they relate. Each
audience has its own file in this directory. Audiences were derived bottom-up from
digested customer and prospect calls, not from assumption. Personas
(`../personas/`), journeys (`../journeys/`), and the proposed Docs IA
(`../information_architecture/`) all trace back to these six segments.

**It does NOT cover:** marketing positioning, pricing tiers, or competitive analysis.

## The organizing axis

The first five audiences are segmented by the question that most predicts needs, pains, and
buying process: **who owns customer-facing docs, and at what company maturity.** Tooling stack,
team size, security posture, and dominant pain all fall out of that axis. The sixth audience
([aud-brownfield-docs-team](brownfield-docs-team.md)) is a deliberate exception: a
**corpus-state lens** that cuts *across* the others (a brownfield doc set can belong to an
enterprise or an outgrown scale-up). Use it when the state of the existing corpus — not team
size or ownership — is the defining problem.

| ID | Audience | Who owns docs | Defining tension |
|----|----------|---------------|------------------|
| [aud-enterprise-docs-team](enterprise-docs-team.md) | Enterprise documentation team | Established team (3–50 writers), often w/ docs-ops & localization | Many products × many eng teams × release timing; security/procurement gauntlet |
| [aud-scaleup-docs-team](scaleup-docs-team.md) | Scale-up / high-growth docs team | 1–3 writers (often solo), docs-as-code | One writer can't keep pace with eng velocity |
| [aud-engineer-owned-docs](engineer-owned-docs.md) | Engineer-owned docs (no writer) | Engineers / a founder champion | No one owns the queue; docs debt accrues silently |
| [aud-oss-maintainer](oss-maintainer.md) | OSS project maintainer | Community maintainers (free OSS program) | Contributors skip doc PRs; multi-repo, versioned, multilingual |
| [aud-devrel-devex](devrel-devex.md) | DevRel / DevEx owner | A developer advocate / DevEx engineer | SDK/API docs must be accurate enough for humans *and* AI agents |
| [aud-brownfield-docs-team](brownfield-docs-team.md) | Established team w/ brownfield corpus *(cross-cutting)* | Established team / senior writer over a large legacy corpus | Remediate & restructure thousands of stale, inconsistent legacy pages without a rewrite |

## Cross-cutting signal (true across most segments)

- **The core job is the same everywhere:** "tell me what changed that needs docs, and draft
  the update — so things stop falling through the cracks." Reactive change-discovery is the
  universal pain.
- **Screenshots** are the most-requested single capability across paid segments.
- **Release timing / feature-flag awareness** (don't draft before it ships) is the most
  common *unsolved* workflow problem.
- **Access & security approval** (GitHub/GitLab app, repo scoping, SSO, self-host) is the
  most common *pilot blocker*, and it escalates sharply with company size.
- **Docs-as-code is a hard prerequisite.** Teams on Word/PDF/CCMS-only (legacy authoring and
  help-authoring tools, SVN) are poor fits today; many arrive mid-migration off a hosted/legacy
  docs platform and treat that migration as part of adopting Promptless.

## Notes on scope decisions

- **Support/CX-owned help centers** appear as a *flavor*
  inside the enterprise and scale-up audiences rather than a sixth segment — the owner's
  title differs but the journey matches.
- Excluded from audiences (present in evidence as non-fits or non-buyers): outsourced docs
  agencies / consulting-deliverable shops, Word/PDF-only teams,
  recruiting, investor, community/devrel, and vendor-pitch calls.

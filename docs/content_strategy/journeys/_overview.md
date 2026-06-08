---
id: journeys-overview
type: overview
scope: Critical user journeys (CUJs) derived from customer & prospect calls, mapped to personas
journeys:
  - cuj-evaluate-pilot
  - cuj-connect-sources
  - cuj-calibrate-suggestions
  - cuj-triage-review-queue
  - cuj-screenshots
  - cuj-backfill-debt
  - cuj-release-notes
  - cuj-multi-repo-routing
  - cuj-oss-onboarding
  - cuj-localization
  - cuj-agent-friendly-docs
  - cuj-migrate-to-docs-as-code
  - cuj-enterprise-security-review
  - cuj-prove-value
  - cuj-remediate-legacy-content
  - cuj-overhaul-ia
---

# Critical User Journeys — Overview

**Scope:** The critical journeys users take *with Promptless*, derived from the call corpus.
Each CUJ has a file here with a trigger, entry point, success criteria, and ordered steps that
map to documentation touchpoints. These journeys are the **input to the proposed Docs IA**
([`../information_architecture/`](../information_architecture/proposed-ia.md)) — the IA exists
to serve them. Touchpoints reference real doc routes where they exist; missing routes are
flagged there as gaps (the point of the exercise), not errors.

Does **not** cover internal/product-development journeys — only user-facing journeys through
the product and its docs.

## CUJ → persona coverage matrix

Every persona has at least one primary journey. ● primary · ○ secondary.

`brownfield-lead` is a cross-cutting persona (often also `enterprise-lead`).

| CUJ | enterprise-lead | scaleup-writer | eng-owner | oss-maintainer | devrel-owner | brownfield-lead |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|
| [evaluate-pilot](cuj-evaluate-pilot.md) | ● | ● | ● | ○ | ● | ○ |
| [connect-sources](cuj-connect-sources.md) | ● | ● | ● | ● | ● | ○ |
| [calibrate-suggestions](cuj-calibrate-suggestions.md) | ● | ● | ● | ○ | ● | ● |
| [triage-review-queue](cuj-triage-review-queue.md) | ○ | ● | ● | ○ | ○ | ○ |
| [screenshots](cuj-screenshots.md) | ● | ● | ○ | ○ | ○ | ○ |
| [backfill-debt](cuj-backfill-debt.md) | ● | ○ | ● | ● | ○ | ● |
| [release-notes](cuj-release-notes.md) | ○ | ○ | ● | ○ | ○ | ○ |
| [multi-repo-routing](cuj-multi-repo-routing.md) | ● | ○ | ○ | ● | ● | ● |
| [oss-onboarding](cuj-oss-onboarding.md) | | | | ● | ○ | |
| [localization](cuj-localization.md) | ● | | | ● | ○ | ○ |
| [agent-friendly-docs](cuj-agent-friendly-docs.md) | ○ | ○ | | ○ | ● | ○ |
| [migrate-to-docs-as-code](cuj-migrate-to-docs-as-code.md) | ● | ● | ○ | | ○ | ● |
| [enterprise-security-review](cuj-enterprise-security-review.md) | ● | ○ | | | | ○ |
| [prove-value](cuj-prove-value.md) | ● | ● | ○ | | ○ | ● |
| [remediate-legacy-content](cuj-remediate-legacy-content.md) | ● | | | | | ● |
| [overhaul-ia](cuj-overhaul-ia.md) | ● | | | | | ● |

## The backbone journey

Most accounts traverse the same spine: **evaluate/pilot → connect sources → calibrate noise →
triage/review the queue → (screenshots, backfill) → prove value → expand.** Security review
runs in parallel for enterprise; OSS onboarding is the open-source variant of connect-sources;
migration is a frequent on-ramp. Calibration (noise/volume/release-timing) is where pilots are
won or lost — it appears in nearly every customer call.

**Brownfield branch.** Teams with a large legacy corpus
([aud-brownfield-docs-team](../audiences/brownfield-docs-team.md)) add a parallel track —
**remediate-legacy-content** and **overhaul-ia** — to fix and restructure what already exists.
These differ from `backfill-debt` (which fills *gaps*): they repair and reorganize *existing*
pages at scale.

# Docs & Audience Strategy (`docs/content_strategy/`)

**Scope:** Versioned, agent-readable strategy artifacts for Promptless — **who we serve**
(audiences), **as whom** (personas), **to do what** (critical user journeys), and **how the
Docs tab should be organized** to serve them (information architecture). These are internal
working docs; they live under `docs/content_strategy/` (repo-root `docs/` is internal meta-docs, not the published Starlight docs in `src/content/docs/`) and are **not** built into the
site.

Derived bottom-up from customer and prospect interviews. Only the synthesized, **anonymized**
strategy is published here — no customer names or source-call references.

## Layout

| Folder | What's in it | Start at |
|--------|--------------|----------|
| [`audiences/`](audiences/_overview.md) | 6 target segments + overview | `_overview.md` |
| [`personas/`](personas/_overview.md) | 1 minimal persona per audience | `_overview.md` |
| [`journeys/`](journeys/_overview.md) | 16 critical user journeys (CUJs) | `_overview.md` |
| [`information_architecture/`](information_architecture/proposed-ia.md) | Proposed Docs-tab IA + gap analysis | `proposed-ia.md` |

## How the pieces link (terminology anchors)

IDs are stable cross-reference anchors; follow them between files:

```
audience (aud-*) ──< persona (persona-*) ──< journey (cuj-*) ──> doc touchpoint (/docs/...)
                                                       │
                                          proposed-ia.md organizes those touchpoints
                                          ia-gap-analysis.md flags the missing ones
```

- Each **persona** names its `audience`; each **CUJ** names its `personas` and maps `steps`
  to real `/docs/...` routes (or flags `[GAP]`/`exists: false`).
- The **IA** is built from the CUJs, scoped to the **Docs tab only** (`src/content/docs/docs/`).

## Headline findings

- **Six audiences**: five split by *who owns docs × company maturity* (enterprise docs team,
  scale-up/solo writer — the largest segment, engineer-owned, OSS maintainer, DevRel/DevEx),
  plus a cross-cutting **brownfield** audience defined by the state of a large existing corpus.
- **Universal job:** "tell me what changed that needs docs, and draft it." Reactive change
  discovery is the shared pain.
- **Pilots are won or lost at calibration** (noise / volume / release-timing) and at the
  **review queue** (who clears it). The IA promotes both to top-level.
- **Biggest content gaps** (see [gap analysis](information_architecture/ia-gap-analysis.md)):
  noise/timing tuning, connection-health troubleshooting, auto-assignment, screenshot depth,
  migration guides, multi-repo/versioned routing, localization, agent-friendliness, reporting.

## Maintaining this

- **Refresh from new interviews:** update the affected audience/persona/journey files as you
  learn more. Keep all findings **anonymized** — no customer names or source-call references in
  these published files.
- **Keep IDs stable** — they're referenced across files and from `AGENTS.md`.
- **Keep frontmatter assertion-dense** (e.g. CUJ `steps[].doc` routes) so it can later be
  link-checked against `src/content/docs/`.

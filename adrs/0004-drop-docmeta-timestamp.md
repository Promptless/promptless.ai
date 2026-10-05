# Drop the docmeta timestamp field

- Status: accepted
- Date: 2026-09-17
- Deciders: Manny
- Context source: #docs Slack thread, 2026-09-17 (Prithvi raised the question; Manny approved removal)

## Context and Problem Statement

[ADR 0006](../docs/starport-migration/adrs/0006-adopt-docmeta.md) adopted docmeta
and gave every docs page three Open Knowledge Format (OKF) fields: `type`, `tags`, and `timestamp`.
`timestamp` is a hand-maintained "date of last meaningful change" kept in
frontmatter. Nothing in the build reads it — Starlight rendering, the route
manifest, and Open Graph image generation all ignore it, and Starlight already
derives its own `lastUpdated` from git. A value edited by hand on every page is
bound to go stale, and its only stated purpose was OKF self-description for agent
consumers, and nothing in this repo consumes that description. Prithvi asked whether it earns its
place; the question is whether to keep populating it.

## Decision Drivers

- Keep frontmatter that readers or the build actually use; drop metadata that
  only decays.
- Preserve the parts of docmeta that work — the required `type` gate and
  path-grounded `tags`.
- Leave room to add other metadata fields later if a consumer needs them.

## Considered Options

- Keep populating `timestamp` on every page.
- Stop populating `timestamp` and remove it from the pages.
- Automate `timestamp` from git so it cannot go stale.

## Decision Outcome

Chosen option: **stop populating `timestamp` and remove it from every docs
page**, because a hand-maintained date no build step reads offers nothing that
offsets its drift. `type` and `tags` stay unchanged — only the `timestamp` field
is removed. Manny approved removing the field now, leaving room to add other
metadata fields later.

The field was stripped from 127 docs pages. `docmeta.config.yaml` and `AGENTS.md`
were updated to match, so neither instructs authors to add `timestamp`. The OKF
schema (`google:okf:0.1`) is unchanged: it still format-checks `timestamp` when a
page carries one, so no schema JSON file changed — no page populates the field.

This decision partially supersedes
[ADR 0006](../docs/starport-migration/adrs/0006-adopt-docmeta.md) — only its
`timestamp`-adoption bullets. The docmeta adoption and the `type`/`tags`
decisions remain accepted.

### Consequences

- Good: One fewer hand-maintained field per page, and no stale last-changed dates
  in frontmatter.
- Good: `type` and `tags` validation is untouched, so the docmeta gate runs as
  before.
- Tradeoff: OKF output carries no per-page timestamp for agent consumers;
  Starlight's git-derived `lastUpdated` remains the only date signal.
- Follow-up: none. Adding a future metadata field means populating it and, where
  required, extending `schemas/custom-frontmatter.schema.json`.

## Pros and Cons of the Options

### Keep populating `timestamp`

- Good: OKF output carries a per-page date.
- Bad: Hand-maintained on every edit, so it goes stale; no build step reads it.

### Stop populating and remove it

- Good: Removes a decaying field with no consumer; leaves `type` and `tags`
  intact.
- Bad: OKF loses a timestamp field some future agent consumer might have used.

### Automate from git

- Good: Always current without hand-maintenance.
- Bad: Duplicates Starlight's existing git-derived `lastUpdated` for a field
  nothing reads, and adds build machinery for no consumer.

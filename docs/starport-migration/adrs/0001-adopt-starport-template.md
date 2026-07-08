# ADR 0001 — Adopt the Starport template via generate-fresh-and-port

- Status: accepted
- Date: 2026-07-08
- Deciders: Manny
- Context source: #docs Slack thread, 2026-07-08

## Context

promptless.ai runs on a custom-maintained fork of Starlight. `Promptless/starport-template`
is the maintained template that Promptless intends to keep current so customer
sites can receive **managed migrations** as new template versions release. The
template's managed-migration hook is `.starport-template.json`, a repo-root
marker whose `templateVersion` field records which template release a site was
generated from; Promptless reads it to know what each site is on.

The template is a **GitHub template repository** (`is_template: true`), not a CLI
generator. There is no `create`/degit scaffolder — new sites are created via
GitHub's "Use this template" flow, then bootstrapped by an agent walking the
decision flow in the template's `AGENTS.md`.

Four adoption models were on the table: fork, git subtree, upstream remote, or
generate-fresh-and-port.

## Decision

**Generate-fresh-and-port.** Scaffold a fresh site from the template, then port
our existing content and configuration into it.

## Rationale

- It is the only model the template actually supports — the template ships as a
  GitHub template repo with a post-generate bootstrap flow, not as a dependency
  or an upstream you can merge from.
- It yields a clean `.starport-template.json` provenance marker
  (`generatedFrom` + `templateVersion`), which is the whole point: it is what
  makes future managed migrations tractable.
- Fork / subtree / upstream-remote would entangle our heavily customized site
  (54 components, 7 Starlight overrides, marketing + blog + changelog +
  automation) with template history and make "which template version am I on"
  ambiguous — defeating managed migration.

## Consequences

- We own the port. The template is docs-only, so everything beyond docs is
  ported by us and carried as-is (see [ADR 0002](0002-whole-site-scope.md)).
- The engine jumps to the template's baseline (Astro 7 / Starlight 0.41 /
  Node 22) — a breaking upgrade sequenced first (plan §Phase 1).
- We add and never delete `.starport-template.json`; `templateVersion` is bumped
  only when re-syncing to a newer template release. The template's own teardown
  checklist explicitly preserves this file.

## Note on template staleness (carry into execution)

The template's prose is inconsistent with its own lockfile: `README.md`
(Prerequisites) and `packages/starlight-mcp/README.md` say **Astro 6** and
`@astrojs/vercel@^10`, while `package.json` pins **Astro 7** and
`@astrojs/vercel@^11`. Trust the lockfile, not the prose, when scaffolding —
and flag the discrepancy upstream to the template maintainers.

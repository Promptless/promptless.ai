# ADR 0002 — Migrate the whole site, not just the docs tree

- Status: accepted
- Date: 2026-07-08
- Deciders: Manny
- Context source: #docs Slack thread, 2026-07-08

## Context

"External docs" is ambiguous. The `promptless.ai` repo is not docs-only: beyond
the 59-page docs tree it hosts the marketing homepage, 44 blog posts, the
changelog (22 entries), pricing, jobs, legal pages, ~54 custom components
(including 7 Starlight overrides), the agent/markdown endpoints (`llms.txt`,
`.md`), and the `generate-article` / `launch-post` automation.

The `starport-template` is **docs-only**: a single `docs` content collection, a
Starlight `splash` `index.mdx` for a landing page, and no provision for a
marketing homepage, blog, changelog, pricing, legal, or a custom component pack.
Those are "add on request" or explicitly out of the template's v1.

## Decision

**Migrate the whole site** — "the whole darn thing" (Manny). The docs tree
adopts the template's mechanics; the non-docs surface is ported and carried
as-is on top of the template-based Astro/Starlight engine.

## Consequences

- **The template does not shrink our surface.** We keep every non-docs route,
  component, and automation. The template gives us the engine baseline, the
  version marker, and the docs-nav/MCP/OpenAPI mechanics; it does not give the
  non-docs surface a home, so we bring our own.
- **The 7 Starlight overrides are the friction point.** They are written against
  Starlight 0.37's component API; the template is on 0.41. Each override
  (Header, Footer, Sidebar, SiteTitle, PageTitle, MobileMenuFooter,
  ThemeProviderLightOnly) must be re-validated against 0.41's component contract
  during the engine upgrade (plan §Phase 1). The `Sidebar` override in
  particular interacts with the nav-mechanic switch (§Phase 3).
- **Automation must keep working.** `generate-article` and `launch-post` write
  into `src/content/blog/` and read `src/content/changelog/`; the ported layout
  must keep those paths and their frontmatter contracts intact, or the two
  customer-facing skills break.
- **Redirects are load-bearing.** The hand-maintained `redirects.json` plus the
  static redirect map in `astro.config.mjs` encode the entire URL history. They
  port verbatim; no historical URL may 404.

## Alternatives rejected

- **Docs-only migration** (just `/docs`): rejected by Manny explicitly. Would
  split the site across two engines and leave the marketing/blog/changelog
  surface on the old fork indefinitely.

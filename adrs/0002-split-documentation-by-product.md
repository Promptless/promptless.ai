# Split documentation by product

- Status: accepted
- Date: 2026-08-19
- Deciders: Promptless product team

## Context and Problem Statement

Promptless now has two products with distinct audiences and documentation needs:
Promptless for Docs and Promptless for Agent Instructions. The existing single
documentation topic cannot identify which product a page belongs to or give
either product a stable place to grow.

## Decision Drivers

- Make both products first-class choices without fragmenting global search,
  `llms*.txt`, or the documentation MCP server.
- Give Promptless for Docs a durable namespace while preserving every existing
  public documentation URL through direct permanent redirects.
- Avoid inventing Agent Instructions setup or behavior documentation before it
  is ready.

## Considered Options

- Keep one documentation topic and mix both products in one sidebar.
- Create two product topics in the existing Starlight site.
- Split the products into separate documentation sites.

## Decision Outcome

Chosen option: **create two product topics in the existing Starlight site**,
because it gives each product a clear information architecture while retaining
one search, machine-readable content surface, and deployment.

Promptless for Docs owns `/docs/for-docs/*`, including the OpenAPI reference.
Promptless for Agent Instructions starts at `/docs/governance` with one landing
page. `/docs/media-kit` and `/docs/marketing-images` remain sidebar-less utility
pages. A shared metadata module supplies labels, destinations, descriptions,
icons, and the removable `New` badge to the header, sidebar, and footer.

This decision supersedes **only** the single-topic Phase 5 resolution in
[Starport ADR 0004 §2](../docs/starport-migration/adrs/0004-adopt-capabilities.md#2-sidebar-topics).
The decisions to use `starlight-sidebar-topics`, directory-driven navigation,
and one unified documentation site remain accepted.

### Consequences

- Good: Readers can select the product they need from the global Docs menu or
  the documentation sidebar and see only that product's navigation.
- Good: Existing HTML, Markdown, Open Graph image, API, and short-alias URLs
  continue to resolve through one-hop permanent redirects.
- Tradeoff: Product moves require coordinated content, redirect, manifest,
  social-card, and compatibility-fixture updates.
- Follow-up: Expand the Agent Instructions topic only when verified product
  documentation is ready.

## Pros and Cons of the Options

### Keep one topic

- Good: No route migration.
- Bad: Product ownership and navigation become ambiguous as the second product
  grows.

### Create two topics in one site

- Good: Clear product boundaries with shared discovery and infrastructure.
- Bad: Requires an atomic route and compatibility migration.

### Create separate sites

- Good: Maximum product isolation.
- Bad: Duplicates search, deployment, analytics, and machine-readable surfaces.

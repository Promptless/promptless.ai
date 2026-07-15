# Adopt the Starport docs MCP server (read-only /mcp via the Vercel adapter)

- Status: accepted
- Date: 2026-07-15
- Deciders: Manny (Promptless)

## Context and Problem Statement

[ADR 0004](0004-adopt-capabilities.md) accepted the Starport template's docs MCP server capability
(`@starport/starlight-mcp`) but deferred it out of Phase 6: "Attempt phase 6 again, but drop the
MCP server capabilities. We'll attempt to add them again later." This ADR records that later
attempt: porting the plugin from
[starport-template](https://github.com/Promptless/starport-template) `packages/starlight-mcp`
into this repo so AI clients (Claude connectors, Cursor, VS Code, Claude Code, the Anthropic API
MCP connector) can search and read the docs over the
[Model Context Protocol](https://modelcontextprotocol.io).

The port was non-trivial because this site differs from the template in ways the plugin's v1
implementation did not anticipate.

## Decision Drivers

- Ship the deferred capability without rewriting it — stay byte-compatible with the template's
  plugin so future Starport re-syncs stay cheap.
- The site is otherwise fully static and depends on platform behavior the SSR adapter must not
  break: `vercel.json` (host redirects, `.md` content-type headers, `/report/:slug` rewrite) and
  the root Vercel Routing Middleware (`middleware.ts`, Accept-header `.md` content negotiation).
- CI (`check` + `test:smoke`) must keep passing without a deployed environment.

## Considered Options

- Port the Starport plugin as-is and fix incompatibilities in place (vendored
  `packages/starlight-mcp`).
- Keep the site static and hand-roll a separate Vercel serverless function (`api/mcp.ts`) around
  the plugin's core.
- Stay deferred (no MCP server).

## Decision Outcome

Chosen option: **port the plugin as-is into `packages/starlight-mcp` and fix the
incompatibilities in the plugin**, keeping the template's architecture (Starlight plugin →
Astro integration → build-time index inlined via a Vite virtual module → injected on-demand
`/mcp` route with a Fetch-native stateless handler). A separate `api/` function would fork the
architecture away from the template for no functional gain.

`astro.config.mjs` gains `adapter: vercel()` and the `starlightMcp({ serverName: 'Promptless
Docs' })` plugin entry, both behind `MCP_ENABLED` (default on; `MCP_ENABLED=false` restores the
fully static, adapter-less build as an escape hatch).

### Port fixes (bugs found and remediated)

1. **Frontmatter `slug` support (load-bearing).** Every docs page in this repo sets an explicit
   `slug:` (e.g. `src/content/docs/internal/component-fixtures.mdx` → `slug:
   docs/internal/component-fixtures`), which Starlight uses verbatim as the route. The template's
   index builder derived routes only from file location, so *all 66 pages* would have carried
   wrong paths/URLs and `get_page` would never match. The builder now honors `slug` verbatim
   (including locale-prefixed slugs) and falls back to file-derived routes otherwise.
2. **`get_page` Markdown cleanup.** Returned pages began with MDX `import` plumbing and, when the
   body opened with its own H1, a duplicated title heading. The builder now strips the leading
   single-line MDX import block and only prepends `# {title}` when the body doesn't already start
   with an H1.
3. **Stale peer range.** The package declared `astro: ^6`; this repo (and the template root) run
   Astro 7. Now `^6 || ^7`.

### Deploy-shape consequences

- With the adapter, `astro build` emits Build Output API artifacts to `.vercel/output/`
  (static site in `static/`, one `_render` function serving only `/mcp`, config redirects as
  platform 301s in `config.json`) instead of `dist/`. `vercel.json`'s `outputDirectory: "dist"`
  was removed — with the adapter the Build Output API directory is the deploy artifact, and
  without it the Astro framework preset already defaults to `dist`.
- `vercel.json` routing (redirects/headers/rewrites) and the root Routing Middleware are
  platform-level features that apply regardless of the adapter ([Vercel: Routing Middleware works
  with any framework](https://vercel.com/docs/routing-middleware)). **Verify both on the first
  preview deploy** (docs.promptless.ai host redirect, `Accept: text/markdown` negotiation) —
  that's the one thing not provable locally.
- Astro-config redirects change from prerendered "Redirecting to: …" stub pages to real platform
  301s — a behavior improvement, matched by the smoke tests, which now accept either form.
- `astro preview` is not supported by `@astrojs/vercel`, so the smoke-test harness
  (`tests/smoke/preview-server.ts`) was rewritten as an in-process static server that serves
  `.vercel/output/static` and applies `config.json` redirect routes (or serves `dist/` for
  `MCP_ENABLED=false` builds).
- `npm run check` now runs the plugin's contract + index tests (`npm run test:mcp`) between
  typecheck and build.

### Consequences

- Good: `/mcp` serves `search` + `get_page` and an `llms.txt` resource over stateless Streamable
  HTTP; the rest of the site stays static. Verified end-to-end against `astro dev` and by 19
  contract/index tests plus the smoke suite.
- Good: removable in one line (plugin entry + adapter), same as the template.
- Tradeoff: the deploy gains one serverless function and the Build Output API shape; local
  `npm run preview` no longer works (use the smoke harness or `vercel dev` instead).
- Follow-up: backport fixes 1–3 to `starport-template` so the template keeps parity with this
  port. Auth (v2, OAuth 2.1 resource server) remains future work per the template's
  `MCP_SERVER_PLAN.md` §6 — the `AuthProvider` seam is retained.

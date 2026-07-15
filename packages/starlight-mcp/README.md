# @starport/starlight-mcp

A [Starlight](https://starlight.astro.build) plugin that serves your documentation
site as a **read-only [MCP](https://modelcontextprotocol.io) server**, so AI clients
(Claude connectors, Cursor, VS Code, Claude Code, the Anthropic API MCP connector)
can search and read your docs.

> **Vendored into promptless.ai from the
> [Starport template](https://github.com/Promptless/starport-template)** — see
> `docs/starport-migration/adrs/0007-docs-mcp-server.md`. This copy adds
> frontmatter `slug:` support in the index builder (this site sets an explicit
> slug on every docs page), cleaner `get_page` Markdown (leading MDX imports
> stripped, no duplicated H1), and an `astro ^6 || ^7` peer range. Backport
> these when re-syncing with the template.

> **v1 is authless** — every page is public. The plugin is built with the seams to
> add OAuth-based authentication and per-user content gating later without a
> rewrite. See `MCP_SERVER_PLAN.md` (repo root) §6 for the eventual auth design.

## What it exposes

- **Transport:** Streamable HTTP (JSON-RPC over `POST`) at `/mcp`.
- **Tools (read-only):**
  - `search({ query, lang?, limit? })` — ranked passages with source URLs.
  - `get_page({ path })` — full Markdown for one page.
- **Resources:** an `llms.txt`-style documentation index.

The request handler uses only standard Fetch APIs (`Request`/`Response`, no Node
`http`). **Verified target: Vercel/Node.** Cloudflare Workers is *not yet verified* —
the SDK's Zod validation uses `new Function` (JIT), which workerd's CSP blocks, so it
would need jitless Zod first (see [Local development](#local-development)).

## Install

This template vendors the plugin in-repo at `packages/starlight-mcp`. Add it to your
Starlight `plugins` array:

```js
// astro.config.mjs
import starlightMcp from './packages/starlight-mcp/src/index.ts';

starlight({
  plugins: [
    starlightMcp(),
    // …other plugins
  ],
});
```

### You must configure an SSR adapter

The `/mcp` route is rendered on demand, so the build needs an adapter. Keep
`output: 'static'`; the plugin only makes its own route on-demand.

```js
import vercel from '@astrojs/vercel';      // Astro 7: @astrojs/vercel@^11 (Astro 6: ^10)
// import cloudflare from '@astrojs/cloudflare'; // experimental — see below

export default defineConfig({
  adapter: vercel(),
  // …
});
```

Without an adapter the plugin logs a warning and the build fails on the on-demand route.

## Options

| Option | Default | Description |
|---|---|---|
| `endpoint` | `'/mcp'` | Route to mount the server at. |
| `enabled` | `true` | When `false`, the route responds `503`. |
| `serverName` | site title | MCP `serverInfo.name`. |
| `corsAllowOrigin` | `'*'` | `Access-Control-Allow-Origin` for the endpoint. |
| `packageDir` | `'packages/starlight-mcp'` | Package location relative to project root (used to resolve the injected route entry). Override if you move the package. |

## Content gating seam (for v2 auth)

Pages may declare access metadata in frontmatter:

```yaml
---
title: Internal runbook
access: internal      # default: public
groups: [partners]    # who may see it once auth exists
---
```

In v1 (authless), every request is anonymous, so `internal` pages are simply not
returned. When v2 adds an authenticated identity, `internal` pages become visible to
users whose groups intersect the page's `groups` — no reindex or schema change.

## Connect a client

```bash
# Claude Code
claude mcp add --transport http docs https://your-site/mcp
```

Cursor / VS Code: add the URL to `mcp.json` / `.vscode/mcp.json`. Inspect with
`npx @modelcontextprotocol/inspector`.

## Local development

`npm run dev` serves the endpoint at `http://localhost:4321/mcp` (the port Astro
prints — it bumps to 4322+ if 4321 is taken).

> **Restart fully after editing the plugin or config.** The `/mcp` route is added
> via `injectRoute` in the integration's `config:setup`, and Astro's in-place
> hot-reload does **not** reliably re-register injected routes. After changing
> `astro.config.mjs` or anything under `packages/starlight-mcp/`, stop and rerun
> `npm run dev`. If the route is live you'll see this on startup:
>
> ```
> [starlight-mcp] MCP server route registered at "/mcp".
> ```
>
> If it's missing — or requests to `/mcp` 404 with a `getStaticPaths()` /
> "Entry docs → 404" router warning — the route fell through to Starlight's
> catch-all; do a full restart.

Note: `astro preview` with the Vercel adapter does not execute the `/mcp`
function, so it will 404 there. Use `npm run dev` locally, or a real deploy.

## Verifying against a Vercel preview deployment

Preview URLs sit behind Vercel Deployment Protection, so a plain `curl` or MCP
client gets `401 {"error":{"message":"Protected deployment"}}` before the
request ever reaches the server. Two ways through:

### Option A — browser console (no settings changes)

Open the preview URL in a browser that's logged into Vercel (SSO completes
automatically), then run this in the DevTools console:

```js
(async () => {
  const out = {};
  out.mcp = await fetch('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  }).then(r => r.json());
  out.search = await fetch('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'search', arguments: { query: 'slack trigger', limit: 2 } } }),
  }).then(r => r.json());
  // Root routing-middleware check (Accept-based .md negotiation):
  const md = await fetch('/docs/start-here/welcome', { headers: { accept: 'text/markdown' } });
  out.middleware = { contentType: md.headers.get('content-type'), startsWithMd: (await md.text()).trimStart().startsWith('#') };
  console.log(JSON.stringify(out, null, 2));
})();
```

### Option B — protection bypass (for curl / real MCP clients)

Generate a secret under **Vercel project → Settings → Deployment Protection →
Protection Bypass for Automation**, then send it as a header:

```bash
curl -X POST "https://<preview>.vercel.app/mcp" \
  -H "x-vercel-protection-bypass: $BYPASS_SECRET" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

claude mcp add --transport http docs-preview "https://<preview>.vercel.app/mcp" \
  --header "x-vercel-protection-bypass: $BYPASS_SECRET"
```

### What to expect

- `tools/list` → `search` and `get_page`, each with `readOnlyHint: true`.
- `search` → ranked results whose URLs point at the **canonical `SITE_URL`**
  (e.g. `https://promptless.ai/...`), not the preview host — the index bakes
  absolute URLs at build time. That is correct for production.
- The middleware check → `content-type: text/markdown` and a Markdown body
  (proves the root Routing Middleware survived the Build Output API deploy).
- Host-conditioned `vercel.json` redirects (e.g. a `docs.` subdomain rule)
  cannot be exercised on a preview URL — the host never matches. Production
  only.

## Architecture

```
src/
  index.ts          Starlight plugin (config:setup → addIntegration)
  integration.ts    builds the index, inlines it via a Vite virtual module, injects /mcp
  route.ts          thin Astro endpoint → core handler
  core/             Node-free (Fetch-only) request path: transport (wraps the MCP SDK's Fetch-native
                    WebStandardStreamableHTTPServerTransport), server (per-request McpServer),
                    tools, resources, auth seam, index query. Node fs only in
                    core/index/build.ts (build-time).
```

## Extraction

This is authored as a standalone package (`private: true`). To publish it: flip
`private`, add a build step that compiles `src` to `dist` with file extensions on
relative imports, and update `exports`/`main`/`types` accordingly.

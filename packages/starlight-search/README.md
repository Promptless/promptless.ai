# Starport search and assistant

An in-repo Starlight plugin. Copy this directory unchanged into customer sites,
as with `starlight-mcp`. Site configuration, branding, headers and analytics stay
outside the plugin. No embeddings, database, shared service or accounts.

## Setup

Install the dependencies listed in the template's `package.json`, including
MiniSearch, React, the AI SDK, Cheerio and Turndown. Register `react()` as an Astro
integration, then add the plugin to Starlight:

```js
import starlightSearch, { searchIncludeFiles } from './packages/starlight-search/src/index.ts';

const assistant = Boolean(process.env.ANTHROPIC_API_KEY);
// Pass includeFiles to your existing Vercel adapter. Keep any existing options.
const adapter = vercel({ includeFiles: searchIncludeFiles });

// Inside starlight({ plugins: [...] }):
starlightSearch({
  assistant,
  docsPaths: ['/docs'],
  apiPaths: ['/api'],
  exclude: ['/docs/internal/*'],
});
```

The template already wires this up. `ANTHROPIC_API_KEY` must be available to the
build process (to expose the assistant UI) and the Node server (to call Anthropic).
The same-origin endpoint is `/_starport/assistant`, outside legacy `/api/*`
reference redirects. On Vercel, add the key to Preview and Production as
appropriate, then rebuild. For
local development, export the variable in the shell before running Astro. Never
use a `PUBLIC_` prefix. Removing the key requires rebuilding to hide entry points;
the endpoint returns 503 immediately if its runtime key is absent.

`STARPORT_ASSISTANT_MODEL` optionally overrides the pinned default
`claude-haiku-4-5-20251001`. The endpoint calls Anthropic directly; extended
thinking and automatic provider retries are disabled.

Search works on static deployments. Set `assistant: false`, omit the adapter
unless another feature needs it, and build normally. In the template,
`MCP_ENABLED=false` with no Anthropic key produces a static build. The assistant
supports Vercel/Node in this release, not Cloudflare Workers.

## Integration points

- The plugin replaces Starlight's `Search` and `PageFrame`, disabling Pagefind.
  The frame wraps the standard frame and mounts a single React island across
  Starlight pages, including pages built with `StarlightPage`.
- A custom header must import `src/components/Search.astro` from this package
  explicitly. Starlight's component override cannot replace direct imports.
- With a custom page frame, use the exported `searchIntegration` yourself,
  disable Pagefind, and mount `SearchRoot.astro` once outside your page content.
  Mark the page container `id="starport-site" data-starport-page` for reflow and
  mobile focus isolation. Carry `data-starport-exclude-page` for excluded pages.
- Separate non-Starlight layouts can mount the same root and control. Rendered
  HTML with a `<main>` is indexed even when it has no search control.
- Colors and fonts inherit Starlight tokens. The desktop panel is 420px wide;
  screens below 1024px use a full-screen overlay. Escape closes it. On desktop,
  readers can move focus back to the documentation while chatting.

## Content and search

`astro:build:generated` extracts main content from the rendered HTML, after MDX
and OpenAPI generation and before Vercel packages the server. Real heading IDs,
code samples, links and tables are preserved. Navigation, controls, redirects,
drafts, `noindex` pages, internal routes and `pagefind: false` pages are excluded.
Use `data-search-exclude` or `data-pagefind-ignore` to exclude an element, and
`exclude` for exact paths or prefixes ending in `/*`. Hiding a sidebar item alone
does not exclude a page; each site must configure any additional private paths.
Only published content belongs in this public index.

MiniSearch indexes page titles, section headings and body text with weights
4/3/1. Docs and API references get a 1.15 multiplier. Queries use AND matching,
prefix matches and bounded edit-distance matching. Configuration identifiers
retain underscores; Unicode words support English and Spanish without a custom
stemmer. The search dialog follows the current route’s language, including Starlight’s
untranslated fallback pages. The shared API searches all locales by default and
accepts locale and content-type filters; the assistant can search across languages.

The browser fetches a manifest and content-hashed serialized index when the
control is approached or opened. A worker loads and searches it once per page.
HTTP caching reuses the hashed artifact across navigation. Assistant search uses
the same index and query function. `readPage` accesses only indexed IDs.

Generated files live in `.starport/search/` (server index and page contents) and
`starport-search/` in the static output (manifest and browser index). Do not
commit them. Vercel's `includeFiles` bundles the two server files; their runtime
location is `.starport/search/` relative to the function's working directory.

Development serves the latest generated artifacts and shows an explicit build
instruction. Run `npm run build` after editing content. A deployed production
build preview is the authoritative test; the dev server does not maintain a
second source-based index.

## Assistant limits and state

- Up to three tool-use rounds followed by a final response; approximately 1,000
  generated tokens across the answer (including tool arguments) and a 30-second
  request deadline. Request aborts cancel provider
  work. Search and reading tools run directly in the same process.
- Questions: 4,000 characters. Prior answers: up to 20,000 characters. Request
  bodies: 128 KB. History: 24,000 characters, dropping oldest complete turns.
  Read content: at most 10,000 characters per call. All serialized tool results
  share a 32,000-character budget per answer.
- The browser sends text history only. Tool transcripts are not accepted from
  clients or stored as conversation history. Follow-ups can search and read again.
- `sessionStorage` holds conversation text, source links, interruption status
  and panel state in the current tab. No automatic resumption, accounts or
  server-side conversation storage. Clear deletes the conversation. Storage
  failures show a notice and leave the current interaction usable.
- The endpoint accepts same-origin JSON requests and applies an in-memory limit
  of 20 questions per IP per ten minutes, with a bounded map. This is approximate
  per-instance throttling. Multiple instances and restarts reset its protection;
  **it is not a global spending cap**. Configure provider-level limits in the
  customer's Anthropic account.
- Markdown rendering disables raw HTML and images. Clickable answer citations
  are restricted to pages returned by the read tool. Read results include source
  links even when the model omits an inline citation.

The existing MCP plugin remains unchanged and continues to use its own index.

## Analytics

Listen for `window`'s `starport:analytics` event. Its `detail` is
`{ name, properties }`; all events include `page_url`.

| Event | Additional properties |
| --- | --- |
| `search_query` | `query`, `results`, `latency_ms`, `query_ms` |
| `search_result_click` | `query`, `url`, `position` |
| `search_error` | `code` |
| `assistant_question` | `question`, `question_length` |
| `assistant_source_click` | `url` |
| `assistant_latency` | `stage` (`first_text` or `complete`), `latency_ms`, `interrupted` on completion |
| `assistant_error` | `code` |
| `assistant_feedback` | `message_id`, `value` (`up` or `down`) |

No full answer text or tool-result transcripts are emitted. Query/question
events contain visitor input; connect them only through the site's existing
analytics/consent setup. Remove old Pagefind input observers to avoid duplicates.

## Validation

`npm run test:search` covers rendered extraction, exclusions, shared search,
history, storage, request limits, throttling, SDK tool streaming, provider errors,
and cancellation. `npm run check` includes these tests and the production build.

Before release, inspect the Vercel output for bundled artifacts and test a real
model on a deployed preview. Check desktop/mobile focus, both themes, Spanish,
navigation/reload, clear/retry/stop, missing credentials, and a few ordinary
visitor tasks. Warm search around 150ms and useful answer text around five
seconds are experience targets, not guaranteed service levels.

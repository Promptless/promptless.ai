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
`claude-sonnet-5`. The endpoint calls Anthropic directly with `effort: "low"`;
extended thinking and automatic provider retries are disabled. Model overrides
must support Anthropic’s effort parameter. Low effort controls response and tool
verbosity even with thinking disabled. See [Anthropic’s effort guidance](https://platform.claude.com/docs/en/build-with-claude/effort).

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

Search opens with up to four site-configured starting points per language:

```js
starlightSearch({
  starterLinks: {
    en: [
      { title: 'Quickstart', url: '/docs/quickstart/', description: 'Connect your first integration.' },
      { title: 'Configuration', url: '/docs/reference/', description: 'Look up settings and examples.' },
    ],
  },
});
```

Use route language codes (`en`, `es`), not Starlight's `root` key. Paths are
relative to the site's Astro base and must point to indexed published pages or
sections; the build rejects broken or excluded destinations. Replace the
template's starter links when replacing its sample content. After a visitor
opens a result, the empty state shows their four most recent destinations in
that language. It stores at most twelve destinations in tab-only `sessionStorage`,
with no server history. Without starting points or history, a short prompt is shown.

Article rows use two lines with muted breadcrumbs beside the title. The full
breadcrumb is available on hover; narrow screens show its immediate parent.
Highlighting and excerpts respect word/identifier boundaries. The query-specific
assistant action remains visible below the scrolling results, participates in
arrow-key selection, and supports Alt+Enter (Option+Enter on macOS).

`astro:build:generated` extracts main content from the rendered HTML, after MDX
and OpenAPI generation and before Vercel packages the server. Real heading IDs,
code samples, links and tables are preserved. Navigation, controls, redirects,
drafts, `noindex` pages, internal routes and `pagefind: false` pages are excluded.
Use `data-search-exclude` or `data-pagefind-ignore` to exclude an element, and
`exclude` for exact paths or prefixes ending in `/*`. Hiding a sidebar item alone
does not exclude a page; each site must configure any additional private paths.
Only published content belongs in this public index.

MiniSearch indexes page titles, rendered meta descriptions, section headings and
body text. The default weights are 4/3/2/1. Titles and descriptions count once per
article; the article's body includes all its sections. Separate section records
index headings and section text without repeating title or description boosts.
Results are grouped by article before the ten-result limit, ranked by their
strongest match without adding section scores together. Each result links to the
article, with one additional section link when that section scores above the
article match. This preserves direct anchors for specific settings and procedures.

All field and content-type multipliers are configurable:

```js
starlightSearch({
  ranking: {
    fields: { title: 4, description: 3, heading: 2, body: 1 },
    contentTypes: { docs: 1.15, api: 1.15, blog: 1, marketing: 1 },
  },
});
```

Omitted multipliers use the defaults above. Values must be finite and
non-negative; zero disables a field or content type. Rebuild after changing
ranking. The resolved configuration travels in the serialized index so browser
and assistant searches always use identical settings.

Article records include section headings, so a query such as `Slack permissions`
can combine a page title with a heading. Separate section records retain their
anchor links without repeating the article's title or description boosts.

Queries use AND matching and prefix matching on the last term. Bounded fuzzy
matching runs only when there are no literal or prefix results. Dotted filenames,
hyphenated names and identifiers with underscores remain intact in queries; their
component words are indexed too. For example, `promptless.yaml` requires that
filename, while `yaml` can also find it. Unicode words support English and Spanish
without a custom stemmer. The search dialog follows the current route’s language, including Starlight’s
untranslated fallback pages. The shared API searches all locales by default and
accepts locale and content-type filters; the assistant can search across languages.

The browser fetches a manifest and content-hashed serialized index when the
control is approached or opened. A worker loads and searches it once per page.
HTTP caching reuses the hashed artifact across navigation. Assistant search uses
the same index and query function. `readPage` accesses only indexed IDs.

Index readiness is separate from query results. Empty input shows recent
destinations or configured starter links while the index preloads, with a short
prompt when neither is available. Non-empty queries run immediately in the
worker. Each completed result set retains its query and locale, and stays visible
until its replacement arrives. Keyboard selection belongs to that displayed set.
Operations lasting over 250ms show progress in the existing footer without
moving results. Only query analytics are debounced (200ms), not retrieval.

Generated files live in `.starport/search/` (server index and page contents) and
`starport-search/` in the static output (manifest and browser index). Do not
commit them. Vercel's `includeFiles` bundles the two server files; their runtime
location is `.starport/search/` relative to the function's working directory.

Development serves the latest generated artifacts. A footer indicator exposes
build instructions on hover, focus or click; changed content flags it as needing
a rebuild, and a missing index displays an explicit error and retry action.
Run `npm run build` after editing content, then reload. A deployed production
build preview is the authoritative test; the dev server does not maintain a
second source-based index.

## Assistant limits and state

- Up to three tool-use rounds followed by a final response; approximately 1,000
  generated tokens across the answer (including tool arguments) and a 30-second
  request deadline, including reading the incoming body. Request aborts cancel provider
  work. Search and reading tools run directly in the same process.
- Questions: 4,000 characters. Prior answers: up to 20,000 characters. Request
  bodies: 128 KB. History: 24,000 characters and 100 messages, dropping oldest
  complete turns with the same budget on client and server.
  Read content: at most 10,000 characters per call. All serialized tool results
  share a 32,000-character budget per answer.
- The browser sends text history only. Tool transcripts are not accepted from
  clients or stored as conversation history. Follow-ups can search and read again.
- `sessionStorage` holds conversation text, source links, interruption status
  and panel state in the current tab. No automatic resumption, accounts or
  server-side conversation storage. Clear deletes the conversation. Clear, retry,
  stop and replacement questions wait for the previous SDK request to settle;
  callbacks from superseded requests cannot restore an interruption or error.
  Storage
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
| `search_result_click` | `query`, `url`, `position`, `source` (`search`, `recent`, or `starter`) |
| `search_error` | `code` |
| `assistant_question` | `question`, `question_length` |
| `assistant_source_click` | `url` |
| `assistant_latency` | `stage` (`first_text` or `complete`), `latency_ms`, `interrupted` on completion |
| `assistant_error` | `code` |
| `assistant_feedback` | `message_id`, `value` (`up` or `down`) |

No full answer text or tool-result transcripts are emitted. Query/question
events contain visitor input; connect them only through the site's existing
analytics/consent setup. Remove old Pagefind input observers to avoid duplicates.
Recent and starter destinations emit an empty `query`; opening the dialog alone
does not emit a search query event.

## Validation

`npm run test:search` covers rendered extraction, exclusions, shared search,
history, storage, request limits, throttling, SDK tool streaming, provider errors,
and cancellation. `npm run check` includes these tests and the production build.

Before release, inspect the Vercel output for bundled artifacts and test a real
model on a deployed preview. Check desktop/mobile focus, both themes, Spanish,
navigation/reload, clear/retry/stop, missing credentials, and a few ordinary
visitor tasks. Warm search around 150ms and useful answer text around five
seconds are experience targets, not guaranteed service levels.

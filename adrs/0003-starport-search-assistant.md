# Adopt Starport search and assistant

- Status: accepted
- Date: 2026-09-05
- Deciders: Prithvi

## Context and Problem Statement

Promptless's documentation should demonstrate Starport's capabilities. Its
search needs better results and an optional assistant that can explain the docs
with sources while keeping the page visible.

## Decision Drivers

- Improve ordinary visitors' first encounter with search and chat.
- Build the reusable feature in Starport and adopt identical source here.
- Preserve Promptless branding, header content, analytics and existing MCP.

## Considered Options

- Adopt Starport's in-repo search/assistant plugin.
- Build a Promptless-specific search and chat feature.
- Extend the older Starport RAG and knowledge-graph experiment.

## Decision Outcome

Copy `packages/starlight-search` unchanged from Starport. It builds a MiniSearch
index from rendered HTML and gives the Node assistant direct search/read tools.
Both product docs, generated API pages, blog posts and marketing pages enter the
corpus. Existing hidden-site paths and explicit internal/report paths are
excluded. Docs/API references receive a modest ranking preference.

Update the custom header's search import and retain the homepage announcement.
The plugin's page frame mounts the panel across Starlight pages; colors and
type inherit Promptless's current theme. Session state stays in the browser tab.

Add the customer's Anthropic key to Vercel's build/runtime environment to expose
the assistant. Use Starport’s `claude-sonnet-5` default with low effort and
thinking disabled for concise answers. Without a key, only search is shown.
Pass generated artifacts to the existing Vercel adapter through `includeFiles`. Replace Pagefind's PostHog
observer with the plugin event bridge; keep `site_searched` and document the
additional events without storing full answers or tool transcripts.

### Consequences

- Future customer sites receive the same feature from Starport.
- Promptless owns only configuration, header integration and the analytics bridge.
- The assistant adds no shared backend, accounts or conversation database.
- Provider credentials and spending limits remain a deployment responsibility.
- Real-model preview validation is required before release. Architecture review
  happens on the draft PRs before the deferred PR review toolkit is run.
- Existing MCP behavior remains unchanged.

See [plugin architecture and limits](../packages/starlight-search/README.md) for
the shared implementation contract.

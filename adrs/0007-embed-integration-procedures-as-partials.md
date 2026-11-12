# Embed integration procedures as MDX partials and drop integration pages from the nav

- Status: accepted
- Date: 2026-10-19
- Deciders: Promptless docs team (requested through a Promptless dashboard task, 2026-10-19)
- Context source: [Starlight: Using components](https://starlight.astro.build/components/using-components/), [Astro MDX: importing MDX files](https://docs.astro.build/en/guides/integrations-guide/mdx/)

## Context and Problem Statement

The pages under `docs/for-docs/reference/integrations/` were typed and filed as
reference, but most of each page is a connection procedure. Readers who set up
a trigger, context source, or doc location were sent to a separate integration
page to connect the provider, then back again. The same procedure can't be
copied onto every page that needs it without the copies drifting.

## Decision Drivers

- One source for each connection procedure.
- Put the procedure on the page where the reader needs it.
- Keep the procedure in agent-readable output: the `/<page>.md` endpoint and
  the MCP `get_page` index read raw page source.
- Keep existing integration URLs working. Many pages, the homepage, and the
  search starter links point at them.

## Considered Options

- MDX partials under `src/partials/`, imported as components; integration pages
  left out of the sidebar.
- Copy each procedure onto every host page.
- Keep the integration pages and only link to them.

## Decision Outcome

Chosen option: **MDX partials, integration pages left out of the sidebar**.
Starlight and Astro reuse content by importing an MDX file as a component, so
no plugin is needed.

- Each connection procedure lives in `src/partials/integrations/<name>-connect.mdx`.
  A page embeds it with `import XConnect from '@partials/integrations/x-connect.mdx'`
  and `<XConnect />` under its own heading. The `@partials/*` alias is set in
  `tsconfig.json` and the Vite config.
- Partials hold no headings, so the host page supplies the heading. Astro
  leaves headings from an imported file out of the page's table of contents,
  and `manni lint structure` can't see them. Links in a partial are root-absolute.
- `src/lib/mdx-partials.ts` inlines embedded partials for the raw-source
  readers: the `/<page>.md` endpoint and the MCP index (through the plugin's
  new `transformContent` option). The rendered site, search, and
  `llms-full.txt` work from rendered pages, so they already include partials.
- The Reference > Integrations group is removed from the sidebar config. The
  pages aren't `sidebar.hidden`, because that would also drop them from search,
  the sitemap, and `llms.txt`. Each integration page embeds the same partials
  in place of its own steps.

### Consequences

- Good: one copy of each procedure, shown on every page that needs it.
- Good: integration URLs and anchors keep working.
- Tradeoff: partials sit outside `src/content/docs`, so Vale, remark-lint, and
  manni don't scan them by default. Lint them explicitly when you edit them.
- Tradeoff: a partial can't carry a heading. Content that needs its own
  heading stays on a page.

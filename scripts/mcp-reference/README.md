# MCP tools reference generator

The [MCP tools reference](../../src/content/docs/docs/for-docs/reference/mcp-tools.mdx)
is generated from the MCP server's own definitions. That covers each tool's description,
annotation, arguments, and result fields, and the skills and resources each server path
serves. Nobody writes those sections by hand.

| File | Role |
| --- | --- |
| `export-catalog.py` | Writes what `tools/list`, `skills/list`, and `resources/list` return on each documented server path to `src/data/mcp/catalog.json`. `DOCUMENTED_SURFACES` lists those paths by profile key. A server path missing from it isn't exported. Promptless's refresh job runs it. |
| `src/data/mcp/catalog.json` | The committed catalog snapshot. |
| `generate.ts` | Renders the catalog into MDX partials under `src/partials/generated/mcp/`. With `--check`, it fails when the partials are stale or the page's tool headings don't match the catalog. |
| `src/partials/generated/mcp/` | Generated partials. Don't edit them by hand. |

## Refresh the reference

A Promptless job exports the catalog when the MCP server changes, and every Monday. It
runs `npm run generate:mcp-reference` and opens one pull request here with the new
catalog and partials. Don't export the catalog by hand. When you review that pull request:

1. Read the page changes it lists, such as a new tool without a heading. Run
   `npm run generate:mcp-reference` on its branch to see them again.
2. If a tool was added, removed, or renamed, update `mcp-tools.mdx`: one
   `` ### `<tool_name>` `` heading per tool, followed by its partial's component. The
   product links to these anchors, so don't rename a heading for a tool that still
   exists.
3. Run `npm run check:mcp-reference`. `npm run check` runs it too, so CI fails when the
   partials or the page drift from the committed catalog.

## Why the page keeps the tool headings

Astro leaves headings in an imported file out of the page's table of contents, and
`manni lint structure` can't see them ([ADR 0007](../../adrs/0007-embed-integration-procedures-as-partials.md)).
So the page owns each `` ### `<tool_name>` `` heading and the generated partial supplies
the content under it. The check keeps the two in step.

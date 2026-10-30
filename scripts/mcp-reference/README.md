# MCP tools reference generator

The [MCP tools reference](../../src/content/docs/docs/for-docs/reference/mcp-tools.mdx)
is generated from the MCP server's own definitions in
[Promptless/promptless](https://github.com/Promptless/promptless) (`runtime/mcp/`).
That covers each tool's description, annotation, arguments, and result fields, and the
skills and resources each server path serves. Nobody writes those sections by hand.

| File | Role |
| --- | --- |
| `export-catalog.py` | Imports the definitions from a Promptless/promptless checkout and writes what `tools/list`, `skills/list`, and `resources/list` return on each server path to `src/data/mcp/catalog.json`. |
| `src/data/mcp/catalog.json` | The committed catalog snapshot. It records the source commit it came from. |
| `generate.ts` | Renders the catalog into MDX partials under `src/partials/generated/mcp/`. With `--check`, it fails when the partials are stale or the page's tool headings don't match the catalog. |
| `src/partials/generated/mcp/` | Generated partials. Don't edit them by hand. |

## Refresh the reference

When the MCP server's tools, skills, or resources change:

1. Check out Promptless/promptless at the commit to document, and install the runtime's
   Python environment (`uv sync --project runtime --frozen` in that checkout).
2. Export the catalog from this repository's root:

   ```sh
   uv run --project <promptless-checkout>/runtime --frozen \
     python scripts/mcp-reference/export-catalog.py --source <promptless-checkout>
   ```

   Importing the definitions needs the runtime's Python dependencies, but no database,
   network, credentials, or running server. The output is deterministic for a given
   source commit.
3. Render the partials:

   ```sh
   npm run generate:mcp-reference
   ```

   It lists any change the page needs, such as a new tool without a heading.
4. If a tool was added, removed, or renamed, update `mcp-tools.mdx`: one
   `` ### `<tool_name>` `` heading per tool, followed by its partial's component. The
   product links to these anchors, so don't rename a heading for a tool that still
   exists.
5. Run `npm run check:mcp-reference`. `npm run check` runs it too, so CI fails when the
   partials or the page drift from the committed catalog.

## Why the page keeps the tool headings

Astro leaves headings in an imported file out of the page's table of contents, and
`manni lint structure` can't see them ([ADR 0007](../../adrs/0007-embed-integration-procedures-as-partials.md)).
So the page owns each `` ### `<tool_name>` `` heading and the generated partial supplies
the content under it. The check keeps the two in step.

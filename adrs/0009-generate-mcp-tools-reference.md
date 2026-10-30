# Generate the MCP tools reference from the server's definitions

- Status: proposed
- Date: 2026-10-30
- Deciders: Manny Silva (docs owner), Promptless docs team

## Context and Problem Statement

The MCP tools reference (`/docs/for-docs/reference/mcp-tools`) described each tool on
the Promptless MCP server by hand. The tool set, arguments, and results change with the
server, so a hand-written list drifts. Manny asked that tool references, and any
documented MCP skills and resources, be generated from code by a script and embedded as
an include. The definitions live in Promptless/promptless (`runtime/mcp/`), and the live
server lists tools only after OAuth.

## Decision Drivers

- The reference matches the definitions the server sends clients.
- The build is deterministic and needs no credentials, network, or Promptless runtime.
- The product links to each `` ### `<tool_name>` `` anchor, so the anchors stay stable.
- Generated content stays in agent-readable output (the `/<page>.md` endpoint and the
  MCP `get_page` index).

## Considered Options

- Export the definitions to a committed JSON catalog, and render MDX partials from it.
- Call the live server's `tools/list` during the build.
- Parse the Python source statically.

## Decision Outcome

Chosen option: **a committed catalog rendered into MDX partials**.
`scripts/mcp-reference/export-catalog.py` imports the definitions from a Promptless/promptless
checkout with the runtime's Python environment, and writes `src/data/mcp/catalog.json`
with the source commit. `scripts/mcp-reference/generate.ts` renders one partial per tool,
the tool tables, and the skills table into `src/partials/generated/mcp/`. The page keeps
each tool heading and embeds the tool's partial under it, as ADR 0007 requires for
partials. `npm run check:mcp-reference`, part of `npm run check`, fails when the partials
are stale or the page's tool headings don't match the catalog.

### Consequences

- Good: the site build reads only committed files. It needs no source checkout or credentials.
- Good: `src/lib/mdx-partials.ts` inlines the generated partials for raw-source readers.
- Tradeoff: refreshing the catalog needs a Promptless/promptless checkout with the
  runtime's dependencies. The export imports internal modules (`runtime.mcp.profiles`,
  `runtime.mcp.skills`), so a refactor there can break it. It fails loudly when it does.
- Tradeoff: the tool descriptions are written for models, and the reference shows them as written.
- Follow-up: a CI job in Promptless/promptless could run the export and open a docs
  change when the catalog differs.

## Pros and Cons of the Options

### Call the live server during the build

- Bad: needs an OAuth grant in CI, and the output depends on what is deployed at build time.

### Parse the Python source statically

- Bad: several schemas are computed at import time from Pydantic models, so a parser
  would miss them or reimplement them.

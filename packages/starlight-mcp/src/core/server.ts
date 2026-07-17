/**
 * Per-request MCP server factory, built on the official MCP SDK's high-level
 * `McpServer`. A fresh server is created for each request (stateless), with tools
 * and resources bound to the caller's identity. The SDK owns the protocol engine
 * (initialize negotiation, capability advertisement, input validation against the
 * Zod schemas, error formatting), so we only supply business logic.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from './context';
import { listResources, renderLlmsTxt } from './resources/index';
import { getPageToolConfig, runGetPage } from './tools/get-page';
import { searchToolConfig, runSearch } from './tools/search';

export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(ctx.serverInfo);

  server.registerTool('search', searchToolConfig, async (args) => runSearch(args, ctx));
  server.registerTool('get_page', getPageToolConfig, async (args) => runGetPage(args, ctx));

  for (const resource of listResources(ctx)) {
    server.registerResource(
      resource.name,
      resource.uri,
      { title: resource.title, description: resource.description, mimeType: resource.mimeType },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: 'text/plain', text: renderLlmsTxt(ctx) }],
      }),
    );
  }

  return server;
}

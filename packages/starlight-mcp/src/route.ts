/**
 * Injected Astro endpoint for the MCP server. Intentionally thin: it adapts the
 * runtime `Request` to the runtime-agnostic core handler and returns its
 * `Response`. All logic lives in `./core`. `data` is inlined at build time by the
 * integration's Vite virtual module, so no filesystem access happens here.
 */
import type { APIContext } from 'astro';
import data from 'virtual:starlight-mcp';
import { AnonymousAuthProvider } from './core/auth/provider';
import { handleMcpRequest } from './core/transport';

export const prerender = false;

// v1 is authless — every request is anonymous (public content only). The
// AuthProvider seam is retained so v2 can drop in an OAuth 2.1 resource server
// behind the same interface without touching the transport or tools.
// See MCP_SERVER_PLAN.md §6.
const authProvider = new AnonymousAuthProvider();

export async function ALL(context: APIContext): Promise<Response> {
  return handleMcpRequest(context.request, {
    index: data.index,
    authProvider,
    serverInfo: data.config.serverInfo,
    siteTitle: data.config.siteTitle,
    siteUrl: data.config.siteUrl,
    enabled: data.config.enabled,
    corsAllowOrigin: data.config.corsAllowOrigin,
    logger: console,
  });
}

/**
 * Fetch-native MCP transport. Wraps the MCP SDK's
 * `WebStandardStreamableHTTPServerTransport` (Web `Request` → `Response`) and
 * builds a fresh stateless server per request (`sessionIdGenerator` undefined,
 * `enableJsonResponse` for single-shot JSON replies).
 *
 * The request path uses only standard Fetch APIs — no Node `http` — which is what
 * makes it portable. NOTE: full Cloudflare Workers support is NOT yet verified.
 * The SDK's Zod-based validation uses `new Function` (JIT), which workerd's CSP
 * blocks, so running there would need jitless Zod plus a Cloudflare build test.
 * The supported/verified target today is Vercel/Node.
 *
 * This layer owns method routing, CORS, the enabled flag, and request logging;
 * the SDK owns protocol negotiation and tool-level errors.
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { AuthProvider } from './auth/provider';
import type { DocEntry } from './index/types';
import { logRequest, newRequestId, type LogSink } from './observability';
import { createMcpServer } from './server';

export interface McpHandlerOptions {
  index: DocEntry[];
  authProvider: AuthProvider;
  serverInfo: { name: string; version: string };
  siteTitle?: string;
  siteUrl?: string;
  /** When false, the endpoint responds 503. Default true. */
  enabled?: boolean;
  /** CORS allowed origin. Default '*'. */
  corsAllowOrigin?: string;
  /** Max request body in bytes (Content-Length based). Default 4 MiB. */
  maxBodyBytes?: number;
  logger?: LogSink;
}

const DEFAULT_MAX_BODY = 4 * 1024 * 1024;

function corsHeaders(origin: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, accept, authorization, mcp-protocol-version, mcp-session-id',
    'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
    'Access-Control-Max-Age': '86400',
  };
  // A specific origin can be used with credentialed requests (needed once auth is
  // wired up); the wildcard '*' cannot be combined with credentials per the spec.
  if (origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  return headers;
}

/**
 * Re-emit the transport's response with CORS headers, buffering the body first.
 * Only POST/JSON responses reach here (GET/SSE is rejected upstream), so the body
 * is always finite — buffering is safe and lets us attach headers and close the
 * per-request server before the body is handed to the host's HTTP layer.
 */
async function finalize(
  res: Response,
  extra: Record<string, string>,
): Promise<{ response: Response; bytes: number }> {
  const body = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  const response = new Response(body.byteLength ? body : null, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
  return { response, bytes: body.byteLength };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export async function handleMcpRequest(request: Request, opts: McpHandlerOptions): Promise<Response> {
  const requestId = newRequestId();
  const start = Date.now();
  const sink = opts.logger;
  const cors = corsHeaders(opts.corsAllowOrigin ?? '*');

  // Best-effort metadata for logging. Only done when logging is on, and on a clone
  // so the body stays readable by the transport.
  let protocolMethod: string | undefined;
  let toolName: string | undefined;
  if (sink && request.method === 'POST') {
    try {
      const peek = await request.clone().json();
      const msg = Array.isArray(peek) ? peek[0] : peek;
      protocolMethod = typeof msg?.method === 'string' ? msg.method : undefined;
      if (protocolMethod === 'tools/call' && typeof msg?.params?.name === 'string') {
        toolName = msg.params.name as string;
      }
    } catch {
      /* ignore — not our job to validate here */
    }
  }

  const finish = (status: number, bytes?: number) => {
    if (sink) {
      logRequest(sink, {
        requestId,
        httpMethod: request.method,
        protocolMethod,
        toolName,
        status,
        durationMs: Date.now() - start,
        contentLength: bytes,
      });
    }
  };

  if (request.method === 'OPTIONS') {
    finish(204);
    return new Response(null, { status: 204, headers: cors });
  }

  if (opts.enabled === false) {
    finish(503);
    return jsonResponse({ error: 'MCP server is disabled.' }, 503, cors);
  }

  // Streamable HTTP is request/response only here (stateless, no server-initiated
  // SSE), so only POST is accepted. Rejecting GET/DELETE also prevents buffering a
  // never-ending SSE stream, which would otherwise hang the invocation.
  if (request.method !== 'POST') {
    finish(405);
    const headers = { ...cors, Allow: 'POST, OPTIONS' };
    // HEAD responses must not carry a body.
    if (request.method === 'HEAD') return new Response(null, { status: 405, headers });
    return jsonResponse(
      { jsonrpc: '2.0', error: { code: -32601, message: `Method ${request.method} not allowed; use POST.` }, id: null },
      405,
      headers,
    );
  }

  // Bound memory: reject oversized bodies up front by Content-Length.
  const declaredLen = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLen) && declaredLen > (opts.maxBodyBytes ?? DEFAULT_MAX_BODY)) {
    finish(413);
    return jsonResponse(
      { jsonrpc: '2.0', error: { code: -32600, message: 'Request body too large.' }, id: null },
      413,
      cors,
    );
  }

  // Declared outside the try so `finally` can always close it, even if
  // connect/handleRequest/finalize throws (avoids leaking a per-request server).
  let server: ReturnType<typeof createMcpServer> | undefined;
  try {
    const identity = await opts.authProvider.authenticate(request);
    server = createMcpServer({
      index: opts.index,
      identity,
      serverInfo: opts.serverInfo,
      siteTitle: opts.siteTitle,
      siteUrl: opts.siteUrl,
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    const res = await transport.handleRequest(request);
    const { response, bytes } = await finalize(res, cors);
    finish(response.status, bytes);
    return response;
  } catch (err) {
    if (sink) sink.error(`[mcp] id=${requestId} internal error: ${(err as Error).message}`);
    finish(500);
    return jsonResponse(
      { jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error.' }, id: null },
      500,
      cors,
    );
  } finally {
    if (server) await server.close().catch(() => {});
  }
}

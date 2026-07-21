/**
 * Minimal structured logging. Logs request metadata and timings; never logs raw
 * user content (query strings, page bodies). Accepts any console-like sink so it
 * works with Astro's integration logger or a plain `console`.
 */

export interface LogSink {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

export interface RequestLogFields {
  requestId: string;
  httpMethod: string;
  protocolMethod?: string;
  toolName?: string;
  status: number;
  durationMs: number;
  contentLength?: number;
}

export function logRequest(sink: LogSink, fields: RequestLogFields): void {
  const parts = [
    `id=${fields.requestId}`,
    `http=${fields.httpMethod}`,
    fields.protocolMethod ? `rpc=${fields.protocolMethod}` : '',
    fields.toolName ? `tool=${fields.toolName}` : '',
    `status=${fields.status}`,
    `dur=${fields.durationMs}ms`,
    fields.contentLength !== undefined ? `bytes=${fields.contentLength}` : '',
  ].filter(Boolean);
  sink.info(`[mcp] ${parts.join(' ')}`);
}

/** Best-effort request id without depending on `crypto.randomUUID` availability. */
export function newRequestId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

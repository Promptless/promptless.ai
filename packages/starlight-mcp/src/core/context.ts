import type { Identity } from './auth/provider';
import type { DocEntry } from './index/types';

/** Per-request context passed to the MCP server factory and the tool/resource handlers. */
export interface McpContext {
  index: DocEntry[];
  identity: Identity;
  serverInfo: { name: string; version: string };
  siteTitle?: string;
  siteUrl?: string;
}

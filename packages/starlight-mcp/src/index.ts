/**
 * starlight-mcp — a Starlight plugin that serves the docs site as a read-only
 * MCP (Model Context Protocol) server.
 *
 * v1 is authless: every page is public, exposed via `search` + `get_page` tools
 * and an `llms.txt` resource over Streamable HTTP at `/mcp`. The architecture is
 * built so authentication + per-user gating can be added in v2 without a rewrite
 * (see `./core/auth/provider.ts` and `MCP_SERVER_PLAN.md` §6).
 *
 * Requires an SSR adapter (@astrojs/vercel or @astrojs/cloudflare) because the
 * MCP route is rendered on demand.
 */
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { mcpIntegration } from './integration';
import type { LocaleDef } from './core/index/build';

export interface StarlightMcpOptions {
  /** Route to mount the MCP server at. Default `/mcp`. */
  endpoint?: string;
  /** Enable the server. When false the route responds 503. Default true. */
  enabled?: boolean;
  /** MCP `serverInfo.name`. Defaults to the site title. */
  serverName?: string;
  /** CORS `Access-Control-Allow-Origin`. Default `*` (public read-only server). */
  corsAllowOrigin?: string;
  /** Package location relative to the project root. Override if you move it. */
  packageDir?: string;
}

const PLUGIN_VERSION = '0.1.0';

interface StarlightConfigLike {
  title?: string | Record<string, string>;
  locales?: Record<string, { lang?: string } | undefined>;
  defaultLocale?: { lang?: string };
}

function coerceTitle(title: StarlightConfigLike['title']): string | undefined {
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object') {
    const first = Object.values(title)[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

function normalizeLocales(config: StarlightConfigLike): LocaleDef[] {
  const locales = config.locales;
  if (!locales || Object.keys(locales).length === 0) {
    return [{ key: 'root', lang: config.defaultLocale?.lang ?? 'en', isRoot: true }];
  }
  return Object.entries(locales).map(([key, val]) => ({
    key,
    lang: val?.lang ?? (key === 'root' ? 'en' : key),
    isRoot: key === 'root',
  }));
}

export default function starlightMcp(options: StarlightMcpOptions = {}): StarlightPlugin {
  return {
    name: 'starlight-mcp',
    hooks: {
      'config:setup': ({ config, addIntegration, logger }) => {
        const cfg = config as StarlightConfigLike;
        const siteTitle = coerceTitle(cfg.title);
        addIntegration(
          mcpIntegration({
            endpoint: options.endpoint ?? '/mcp',
            enabled: options.enabled ?? true,
            serverName: options.serverName ?? (siteTitle ? `${siteTitle} MCP` : 'starlight-mcp'),
            serverVersion: PLUGIN_VERSION,
            siteTitle,
            corsAllowOrigin: options.corsAllowOrigin,
            locales: normalizeLocales(cfg),
            packageDir: options.packageDir ?? 'packages/starlight-mcp',
          }),
        );
        logger.info(`MCP server route registered at "${options.endpoint ?? '/mcp'}".`);
      },
    },
  };
}

/**
 * Astro integration added by the Starlight plugin. It:
 *   1. builds the content index at config time (Node context),
 *   2. inlines `{ index, config }` into a Vite virtual module so it bundles into
 *      the request handler with no runtime fs (verified on Vercel/Node),
 *   3. injects the `/mcp` route as an on-demand (prerendered:false) endpoint,
 *   4. warns if no SSR adapter is configured (the route needs one to build).
 */
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { buildDocsIndex, type LocaleDef } from './core/index/build';
import type { DocEntry } from './core/index/types';

const VIRTUAL_ID = 'virtual:starlight-mcp';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

// JS line/paragraph separators: valid in JSON but invalid in a JS source string
// literal, so they must be escaped before being inlined into the virtual module.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export interface IntegrationOptions {
  /** Route the MCP server is mounted at. Default `/mcp`. */
  endpoint: string;
  /** Master enable flag (the route still exists but responds 503 when false). */
  enabled: boolean;
  /** MCP `serverInfo.name`. */
  serverName: string;
  /** MCP `serverInfo.version`. */
  serverVersion: string;
  /** Human-readable site title, used in resource rendering. */
  siteTitle?: string;
  /** CORS allowed origin. Default `*`. */
  corsAllowOrigin?: string;
  /** Normalized Starlight locales for language detection. */
  locales: LocaleDef[];
  /** Package location relative to project root (for resolving the route entry). */
  packageDir: string;
}

export interface RuntimeConfig {
  serverInfo: { name: string; version: string };
  siteTitle?: string;
  siteUrl?: string;
  enabled: boolean;
  endpoint: string;
  corsAllowOrigin?: string;
}

/**
 * Serialize the inlined payload safely. `JSON.stringify` does not escape U+2028 /
 * U+2029, so doc content containing them would corrupt the generated
 * `export default <json>` virtual module. Escape them to their `\uXXXX` forms.
 */
function serializePayload(value: unknown): string {
  return JSON.stringify(value)
    .split(LINE_SEPARATOR)
    .join('\\u2028')
    .split(PARAGRAPH_SEPARATOR)
    .join('\\u2029');
}

export function mcpIntegration(options: IntegrationOptions): AstroIntegration {
  return {
    name: 'starlight-mcp',
    hooks: {
      'astro:config:setup': ({ config, injectRoute, updateConfig, logger }) => {
        const docsDir = fileURLToPath(new URL('content/docs/', config.srcDir));
        let index: DocEntry[] = [];
        try {
          index = buildDocsIndex({
            docsDir,
            site: config.site,
            base: config.base,
            locales: options.locales,
          });
          logger.info(`Indexed ${index.length} documentation page(s) for the MCP server.`);
        } catch (err) {
          logger.warn(`Failed to build MCP content index: ${(err as Error).message}`);
        }

        const runtimeConfig: RuntimeConfig = {
          serverInfo: { name: options.serverName, version: options.serverVersion },
          siteTitle: options.siteTitle,
          siteUrl: config.site,
          enabled: options.enabled,
          endpoint: options.endpoint,
          corsAllowOrigin: options.corsAllowOrigin,
        };

        const payload = serializePayload({ index, config: runtimeConfig });

        // `updateConfig` deep-merges and CONCATENATES arrays, so passing a single
        // Vite plugin here appends to (does not replace) plugins added elsewhere.
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'starlight-mcp:virtual',
                resolveId(id: string) {
                  if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
                  return null;
                },
                load(id: string) {
                  if (id === RESOLVED_VIRTUAL_ID) return `export default ${payload};`;
                  return null;
                },
              },
            ],
          },
        });

        injectRoute({
          pattern: options.endpoint,
          entrypoint: new URL(`${options.packageDir}/src/route.ts`, config.root),
          prerender: false,
        });
      },

      'astro:config:done': ({ config, logger }) => {
        if (!config.adapter) {
          logger.warn(
            `No SSR adapter configured — the MCP route "${options.endpoint}" needs on-demand ` +
              `rendering and the build will fail without one. Add @astrojs/vercel or ` +
              `@astrojs/cloudflare (see the starlight-mcp README).`,
          );
        }
      },
    },
  };
}

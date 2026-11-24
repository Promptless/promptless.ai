import { fileURLToPath } from 'node:url';
import type { AstroIntegration, HookParameters as AstroHookParameters, InjectedRoute } from 'astro';
import type { HookParameters, StarlightPlugin } from '@astrojs/starlight/types';
import starlightLlmsTxt from 'starlight-llms-txt';

type LlmsTxtOptions = NonNullable<Parameters<typeof starlightLlmsTxt>[0]>;

const LLMS_TXT_ROUTE = '/llms.txt';

/**
 * The plugin's `/llms-full.txt` and `/llms-small.txt` routes, replaced with
 * local routes that leave out pages hidden from the sidebar (see
 * `src/lib/llms-corpora/`). The plugin's `exclude` option only reaches
 * `llms-small.txt`, and hidden pages are already left out of the sitemap and
 * site search.
 */
const CORPUS_ROUTES: Record<string, URL> = {
  '/llms-full.txt': new URL('./llms-corpora/llms-full.txt.ts', import.meta.url),
  '/llms-small.txt': new URL('./llms-corpora/llms-small.txt.ts', import.meta.url),
};

/** Alias the local routes use to import the plugin's generator, which the package doesn't export. */
const PLUGIN_ALIAS = 'starlight-llms-txt-internal';

/**
 * `starlight-llms-txt` without its `/llms.txt` route.
 *
 * The plugin builds `/llms-full.txt` and `/llms-small.txt` from the docs tree.
 * The `/llms.txt` entrypoint is the curated project route in
 * `src/pages/llms.txt.ts`, and Astro treats two static routes at one path as a
 * collision. The plugin has no option to skip that route, so this wrapper drops
 * the one `injectRoute` call for it. It also swaps the full and small corpus
 * routes for local ones that skip hidden pages, and passes everything else
 * through.
 */
export default function starlightLlmsCorpora(options: LlmsTxtOptions): StarlightPlugin {
  const plugin = starlightLlmsTxt(options);
  const setup = plugin.hooks['config:setup'] ?? plugin.hooks.setup;
  if (!setup) throw new Error('starlight-llms-txt no longer registers a config:setup hook');

  return {
    name: 'starlight-llms-corpora',
    hooks: {
      'config:setup'(params: HookParameters<'config:setup'>) {
        return setup({
          ...params,
          addIntegration(integration: AstroIntegration) {
            params.addIntegration(withoutLlmsTxtRoute(integration));
          },
        });
      },
    },
  };
}

function withoutLlmsTxtRoute(integration: AstroIntegration): AstroIntegration {
  const configSetup = integration.hooks['astro:config:setup'];
  if (!configSetup) return integration;

  return {
    ...integration,
    hooks: {
      ...integration.hooks,
      'astro:config:setup'(options: AstroHookParameters<'astro:config:setup'>) {
        return configSetup({
          ...options,
          injectRoute(route: InjectedRoute) {
            if (route.pattern === LLMS_TXT_ROUTE) return;
            const local = CORPUS_ROUTES[route.pattern];
            if (local) {
              options.updateConfig({
                vite: {
                  resolve: {
                    alias: [{ find: PLUGIN_ALIAS, replacement: fileURLToPath(new URL('.', route.entrypoint)) }],
                  },
                },
              });
              options.injectRoute({ ...route, entrypoint: local });
              return;
            }
            options.injectRoute(route);
          },
        });
      },
    },
  };
}

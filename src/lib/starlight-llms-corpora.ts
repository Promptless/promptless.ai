import type { AstroIntegration, HookParameters as AstroHookParameters, InjectedRoute } from 'astro';
import type { HookParameters, StarlightPlugin } from '@astrojs/starlight/types';
import starlightLlmsTxt from 'starlight-llms-txt';

type LlmsTxtOptions = NonNullable<Parameters<typeof starlightLlmsTxt>[0]>;

const LLMS_TXT_ROUTE = '/llms.txt';

/**
 * `starlight-llms-txt` without its `/llms.txt` route.
 *
 * The plugin builds `/llms-full.txt` and `/llms-small.txt` from the docs tree.
 * The `/llms.txt` entrypoint is the curated project route in
 * `src/pages/llms.txt.ts`, and Astro treats two static routes at one path as a
 * collision. The plugin has no option to skip that route, so this wrapper drops
 * the one `injectRoute` call for it and passes everything else through.
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
            options.injectRoute(route);
          },
        });
      },
    },
  };
}

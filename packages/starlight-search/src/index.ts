import type { StarlightPlugin } from '@astrojs/starlight/types';
import { searchIntegration } from './integration';
import type { SearchOptions } from './core/types';
export type { SearchOptions, SearchRankingOptions, SearchRanking } from './core/types';

/** Pass these to the Vercel adapter, which packages them after HTML generation. */
export const searchIncludeFiles = ['.starport/search/index.json', '.starport/search/pages.json'];

export default function starlightSearch(options: SearchOptions = {}): StarlightPlugin {
  return {
    name: 'starport-search',
    hooks: {
      'config:setup': ({ config, updateConfig, addIntegration }) => {
        if (config.components?.PageFrame) throw new Error('Starport search needs its PageFrame. Wrap your custom frame with SearchRoot.astro instead and configure the integration directly.');
        updateConfig({
          pagefind: false,
          components: {
            ...config.components,
            Search: './packages/starlight-search/src/components/Search.astro',
            PageFrame: './packages/starlight-search/src/components/PageFrame.astro',
          },
        });
        const title = typeof config.title === 'string' ? config.title : Object.values(config.title)[0];
        addIntegration(searchIntegration(options, title));
      },
    },
  };
}

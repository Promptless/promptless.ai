import type { APIRoute } from 'astro';
// @ts-expect-error Virtual module the plugin registers. It has no type declarations here.
import { starlightLllmsTxtContext } from 'virtual:starlight-llms-txt/context';
// @ts-expect-error Aliased to the plugin's generator in src/lib/starlight-llms-corpora.ts.
import { generateLlmsTxt } from 'starlight-llms-txt-internal/generator';
// @ts-expect-error Aliased to the plugin's utils in src/lib/starlight-llms-corpora.ts.
import { getSiteTitle } from 'starlight-llms-txt-internal/utils';
import { hiddenDocIds } from './hidden';

export const prerender = true;

/** `starlight-llms-txt`'s `/llms-small.txt` route, without pages hidden from the sidebar. */
export const GET: APIRoute = async (context) => {
  const body = await generateLlmsTxt(context, {
    minify: true,
    description: `This is the abridged developer documentation for ${getSiteTitle()}`,
    exclude: [...starlightLllmsTxtContext.exclude, ...(await hiddenDocIds())],
  });
  return new Response(body);
};

import { getCollection } from 'astro:content';

/**
 * IDs of docs pages hidden from the sidebar. The sitemap and site search
 * already leave these out (`src/lib/sitemap-filter.mjs`), so the llms corpora
 * leave them out too: an expired offer or an internal fixture page shouldn't
 * reach agents when people can't find it.
 */
export async function hiddenDocIds(): Promise<string[]> {
  const hidden = await getCollection('docs', (doc) => doc.data.sidebar?.hidden === true);
  return hidden.map((doc) => doc.id);
}

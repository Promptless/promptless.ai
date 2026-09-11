import { readFile as readFileFromDisk } from 'node:fs/promises';
import { join } from 'node:path';
import { loadIndex, readPage, search } from '../core/search';
import type { ContentArtifact, SearchArtifact, SearchFilters } from '../core/types';

export async function loadCorpus(dir: string) {
  const [indexData, contentData] = await Promise.all([
    readFileFromDisk(join(dir, 'index.json'), 'utf8'), readFileFromDisk(join(dir, 'pages.json'), 'utf8'),
  ]);
  const artifact = JSON.parse(indexData) as SearchArtifact;
  const content = JSON.parse(contentData) as ContentArtifact;
  if (content.version !== 1) throw new Error('Unsupported content artifact. Rebuild the site.');
  const index = loadIndex(artifact);
  const pages = new Map(content.pages.map((page) => [page.id, page]));
  return {
    contentVersion: artifact.generatedAt,
    search: (query: string, filters?: SearchFilters) => search(index, query, filters),
    readPage: (pageId: string, sectionId?: string) => readPage(pages, pageId, sectionId),
    pageId: (path: string) => [path, path + '/', path.replace(/\/$/, '')].find((id) => pages.has(id)),
  };
}
export type Corpus = Awaited<ReturnType<typeof loadCorpus>>;

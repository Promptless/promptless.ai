import MiniSearch, { type Options } from 'minisearch';
import type { Page, SearchArtifact, SearchDocument, SearchFilters, SearchResult } from './types';

const options: Options<SearchDocument> = {
  fields: ['title', 'heading', 'text'],
  storeFields: ['pageId', 'sectionId', 'url', 'title', 'heading', 'text', 'locale', 'type', 'breadcrumbs'],
  // Preserve configuration identifiers while supporting Unicode words in all locales.
  tokenize: (text) => text.split(/[^\p{L}\p{N}_]+/u).filter(Boolean),
  searchOptions: {
    boost: { title: 4, heading: 3, text: 1 },
    // MiniSearch discounts prefix/fuzzy matches relative to exact matches.
    prefix: true,
    fuzzy: (term: string) => term.length >= 5 ? 2 : term.length >= 4 ? 1 : false,
    combineWith: 'AND',
  },
};

export function documentsFor(pages: Page[]): SearchDocument[] {
  return pages.flatMap((page) => page.sections.map((section) => ({
    id: `${page.id}#${section.id}`,
    pageId: page.id,
    sectionId: section.id,
    url: page.id + (section.id ? `#${encodeURIComponent(section.id)}` : ''),
    title: page.title,
    heading: section.heading,
    text: section.text,
    locale: page.locale,
    type: page.type,
    breadcrumbs: page.breadcrumbs,
  })));
}

export function createIndex(pages: Page[]) {
  const index = new MiniSearch<SearchDocument>(options);
  index.addAll(documentsFor(pages));
  return index;
}

export function loadIndex(artifact: SearchArtifact) {
  if (artifact.version !== 1) throw new Error('Unsupported search index. Rebuild the site.');
  return MiniSearch.loadJS<SearchDocument>(artifact.index, options);
}

/** The worker and the assistant import this exact query path. */
export function search(index: MiniSearch<SearchDocument>, query: string, filters: SearchFilters = {}): SearchResult[] {
  const input = query.trim().slice(0, 300);
  if (!input) return [];
  return index.search(input, {
    filter: (result) => (!filters.locale || result.locale === filters.locale) && (!filters.type || result.type === filters.type),
    boostDocument: (_id, _term, stored) => stored?.type === 'docs' || stored?.type === 'api' ? 1.15 : 1,
  }).slice(0, Math.min(Math.max(filters.limit ?? 10, 1), 20)).map((result) => ({
    ...(result as unknown as SearchResult), terms: result.terms,
  }));
}

export function readPage(pages: ReadonlyMap<string, Page>, pageId: string, sectionId?: string) {
  const page = pages.get(pageId);
  if (!page) return null;
  const sections = sectionId === undefined ? page.sections : page.sections.filter((section) => section.id === sectionId);
  if (!sections.length) return null;
  return {
    pageId: page.id, title: page.title, locale: page.locale,
    url: page.id + (sectionId ? `#${encodeURIComponent(sectionId)}` : ''),
    sections: sections.map(({ id, heading, markdown }) => ({ id, heading, markdown })),
  };
}

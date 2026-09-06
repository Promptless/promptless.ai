import MiniSearch, { type Options, type SearchOptions as MiniSearchOptions } from 'minisearch';
import type { Page, SearchArtifact, SearchDocument, SearchFilters, SearchRanking, SearchRankingOptions, SearchResult, SectionMatch } from './types';

export function resolveRanking(options: SearchRankingOptions = {}): SearchRanking {
  const ranking = {
    fields: { title: 4, description: 3, heading: 2, body: 1, ...options.fields },
    contentTypes: { docs: 1.15, api: 1.15, blog: 1, marketing: 1, ...options.contentTypes },
  };
  for (const [group, weights] of Object.entries(ranking)) {
    for (const [field, value] of Object.entries(weights)) {
      if (!Number.isFinite(value) || value < 0) throw new Error(`Search ranking ${group}.${field} must be a finite, non-negative number.`);
    }
  }
  return ranking;
}

const options: Options<SearchDocument> = {
  fields: ['title', 'description', 'heading', 'body'],
  storeFields: ['pageId', 'sectionId', 'url', 'pageTitle', 'description', 'heading', 'text', 'locale', 'type', 'breadcrumbs'],
  tokenize: (text, field) => {
    // Keep filenames and identifiers intact in queries. Index their component
    // words too, so "yaml" can still find "promptless.yaml".
    const tokens = text.match(/[\p{L}\p{N}_]+(?:[.-][\p{L}\p{N}_]+)*/gu) || [];
    return field ? tokens.flatMap((token) => /[.-]/.test(token) ? [token, ...token.split(/[.-]/)] : [token]) : tokens;
  },
};

export function documentsFor(pages: Page[]): SearchDocument[] {
  return pages.flatMap((page) => {
    const common = { pageId: page.id, pageTitle: page.title, locale: page.locale, type: page.type, breadcrumbs: page.breadcrumbs };
    return [{
      ...common, id: page.id, sectionId: '', url: page.id, title: page.title,
      description: page.description, heading: '', text: page.sections[0]?.text || '',
      body: page.sections.map((section) => section.text).join('\n'),
    }, ...page.sections.filter((section) => section.id).map((section) => ({
      ...common, id: `${page.id}#${section.id}`, sectionId: section.id,
      url: page.id + '#' + encodeURIComponent(section.id), title: '', description: '',
      heading: section.heading, text: section.text, body: section.text,
    }))];
  });
}

export function createIndex(pages: Page[], rankingOptions?: SearchRankingOptions) {
  const ranking = resolveRanking(rankingOptions);
  const engine = new MiniSearch<SearchDocument>(options);
  engine.addAll(documentsFor(pages));
  return { engine, ranking };
}

export function loadIndex(artifact: SearchArtifact) {
  if (artifact.version !== 2) throw new Error('Unsupported search index. Rebuild the site.');
  return { engine: MiniSearch.loadJS<SearchDocument>(artifact.index, options), ranking: resolveRanking(artifact.ranking) };
}

/** The worker and assistant share ranking, literal matching, and page grouping. */
export function search({ engine, ranking }: ReturnType<typeof createIndex>, query: string, filters: SearchFilters = {}): SearchResult[] {
  const input = query.trim().slice(0, 300);
  if (!input) return [];
  const searchOptions: MiniSearchOptions = {
    boost: ranking.fields,
    // MiniSearch treats a zero boost as its default; omit disabled fields.
    fields: Object.keys(ranking.fields).filter((field) => ranking.fields[field as keyof typeof ranking.fields] > 0),
    combineWith: 'AND',
    prefix: (_term, i, terms) => i === terms.length - 1,
    filter: (result) => (!filters.locale || result.locale === filters.locale) && (!filters.type || result.type === filters.type) && ranking.contentTypes[result.type as keyof typeof ranking.contentTypes] > 0,
    boostDocument: (_id, _term, stored) => ranking.contentTypes[stored?.type as keyof typeof ranking.contentTypes] ?? 1,
  };
  let hits = engine.search(input, searchOptions);
  // Typos are a fallback, so fuzzy variants cannot displace literal matches.
  if (!hits.length) hits = engine.search(input, { ...searchOptions, fuzzy: (term) => term.length >= 5 ? 2 : term.length >= 4 ? 1 : false });

  const groups = new Map<string, { result: SearchResult; pageScore: number; section?: SectionMatch }>();
  for (const hit of hits) {
    const data = hit as unknown as SearchDocument & { score: number; terms: string[] };
    let group = groups.get(data.pageId);
    if (!group) {
      group = { pageScore: 0, result: {
        id: data.pageId, pageId: data.pageId, url: data.pageId, title: data.pageTitle,
        description: String(engine.getStoredFields(data.pageId)?.description || ''), text: data.text, locale: data.locale, type: data.type,
        breadcrumbs: data.breadcrumbs, sections: [], score: data.score, terms: data.terms,
      } };
      groups.set(data.pageId, group);
    }
    if (!data.sectionId) {
      group.pageScore = data.score;
      group.result.description = data.description;
      if (data.score >= group.result.score) group.result.text = data.text;
    } else if (!group.section) {
      group.section = { id: data.id, sectionId: data.sectionId, heading: data.heading,
        url: data.url, text: data.text, score: data.score, terms: data.terms };
    }
  }
  // Sorted MiniSearch hits establish page order by the strongest match, never
  // by adding up all its sections. A long article cannot monopolize the list.
  return [...groups.values()].slice(0, Math.min(Math.max(filters.limit ?? 10, 1), 20)).map(({ result, pageScore, section }) => ({
    ...result, sections: section && section.score > pageScore ? [section] : [],
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

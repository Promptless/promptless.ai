export type ContentType = 'docs' | 'api' | 'blog' | 'marketing';

export interface Section {
  id: string;
  heading: string;
  markdown: string;
  text: string;
}

export interface Page {
  id: string;
  title: string;
  description: string;
  locale: string;
  type: ContentType;
  breadcrumbs: string[];
  sections: Section[];
}

export interface SearchDocument {
  id: string;
  pageId: string;
  sectionId: string;
  url: string;
  title: string;
  pageTitle: string;
  description: string;
  heading: string;
  body: string;
  text: string;
  locale: string;
  type: ContentType;
  breadcrumbs: string[];
}

export interface SectionMatch {
  id: string;
  sectionId: string;
  heading: string;
  url: string;
  text: string;
  score: number;
  terms: string[];
}

export interface SearchResult {
  id: string;
  pageId: string;
  url: string;
  title: string;
  description: string;
  text: string;
  locale: string;
  type: ContentType;
  breadcrumbs: string[];
  sections: SectionMatch[];
  score: number;
  terms: string[];
}

export interface SearchRanking {
  fields: Record<'title' | 'description' | 'heading' | 'body', number>;
  contentTypes: Record<ContentType, number>;
}

export interface SearchRankingOptions {
  fields?: Partial<SearchRanking['fields']>;
  contentTypes?: Partial<SearchRanking['contentTypes']>;
}

export interface SearchFilters {
  locale?: string;
  type?: ContentType;
  limit?: number;
}

export interface SearchArtifact {
  version: 2;
  generatedAt: string;
  ranking: SearchRanking;
  index: ReturnType<import('minisearch').default<SearchDocument>['toJSON']>;
}

export interface ContentArtifact {
  version: 1;
  pages: Page[];
}

export interface SearchShortcut {
  url: string;
  title: string;
  description?: string;
}

export interface SearchOptions {
  /** Up to four published starting points per locale, before a visitor has recent destinations. */
  starterLinks?: Record<string, SearchShortcut[]>;
  /** Serialized with the index so browser and assistant agree. Rebuild after changes. */
  ranking?: SearchRankingOptions;
  /** Enable the Node endpoint. Configure ANTHROPIC_API_KEY at build and runtime. */
  assistant?: boolean;
  /** Exact paths or path prefixes ending in /*. Applied before extraction. */
  exclude?: string[];
  /** URL prefixes used to distinguish API references and docs from other pages. */
  apiPaths?: string[];
  docsPaths?: string[];
}

export interface ClientConfig {
  starterLinks?: Record<string, SearchShortcut[]>;
  assistant: boolean;
  endpoint: string;
  manifestUrl: string;
  siteTitle: string;
  dev: boolean;
}

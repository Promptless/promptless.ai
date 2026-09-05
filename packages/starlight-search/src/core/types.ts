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
  heading: string;
  text: string;
  locale: string;
  type: ContentType;
  breadcrumbs: string[];
}

export interface SearchResult extends SearchDocument {
  score: number;
  terms: string[];
}

export interface SearchFilters {
  locale?: string;
  type?: ContentType;
  limit?: number;
}

export interface SearchArtifact {
  version: 1;
  generatedAt: string;
  index: ReturnType<import('minisearch').default<SearchDocument>['toJSON']>;
}

export interface ContentArtifact {
  version: 1;
  pages: Page[];
}

export interface SearchOptions {
  /** Enable the Node endpoint. Configure ANTHROPIC_API_KEY at build and runtime. */
  assistant?: boolean;
  /** Exact paths or path prefixes ending in /*. Applied before extraction. */
  exclude?: string[];
  /** URL prefixes used to distinguish API references and docs from other pages. */
  apiPaths?: string[];
  docsPaths?: string[];
}

export interface ClientConfig {
  assistant: boolean;
  endpoint: string;
  manifestUrl: string;
  siteTitle: string;
  dev: boolean;
}

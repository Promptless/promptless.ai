export type ContentType = 'docs' | 'blog' | 'changelog';

export interface RouteManifestEntry {
  sourcePath: string;
  contentType: ContentType;
  routePath: string;
  title: string;
  hidden: boolean;
  order: number;
  section?: string;
  tab?: string;
  slug?: string;
  description?: string;
  date?: string;
}

export interface RedirectRule {
  source: string;
  destination: string;
  permanent?: boolean;
}

export interface GeneratedRedirectManifest {
  redirects: RedirectRule[];
}

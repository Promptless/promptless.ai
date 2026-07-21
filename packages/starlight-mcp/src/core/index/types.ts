/**
 * Shared content-index types. The index is generated at build time
 * (see `./build.ts`) and queried at request time (see `./query.ts`).
 *
 * The `access` and `groups` fields are the auth-readiness seam: v1 is authless
 * and every page is `public`, but the schema already carries the metadata so
 * that adding per-user gating in v2 is purely additive (populate `groups` from
 * frontmatter + supply a non-anonymous identity — no reindex/migration).
 */

export type AccessLevel = 'public' | 'internal';

export interface DocEntry {
  /** Page title from frontmatter. */
  title: string;
  /** Absolute URL when `site` is configured, otherwise the route path. */
  url: string;
  /** Route path, e.g. `/getting-started/welcome/`. */
  path: string;
  /** Language code: the root locale's lang (e.g. `en`) or a locale key (e.g. `es`). */
  lang: string;
  /** Visibility tier. v1 emits `public` for everything. */
  access: AccessLevel;
  /** Groups permitted to see this page when `access` is `internal`. Empty in v1. */
  groups: string[];
  /** Plain-text rendition of the body, used for ranking + snippets. */
  text: string;
  /** Raw Markdown body (with a leading `# title`), returned by `get_page`. */
  markdown: string;
}

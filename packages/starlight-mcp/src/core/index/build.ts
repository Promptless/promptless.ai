/**
 * Build-time content index generation.
 *
 * Runs inside the Astro integration (Node context), NOT at request time — this
 * is the only module in the package that touches `node:fs`. It walks the
 * Starlight docs collection, parses frontmatter, computes each page's route +
 * language, and produces `DocEntry[]` that the integration inlines into the
 * request handler via a Vite virtual module.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { slug as githubSlug } from 'github-slugger';
import matter from 'gray-matter';
import type { AccessLevel, DocEntry } from './types';

export interface LocaleDef {
  /** Directory prefix / locale key. The root locale has `isRoot: true`. */
  key: string;
  /** BCP-47 language tag for this locale. */
  lang: string;
  isRoot: boolean;
}

export interface BuildIndexOptions {
  /** Absolute path to `src/content/docs`. */
  docsDir: string;
  /** `astroConfig.site`, if set. */
  site?: string;
  /** `astroConfig.base`, default `/`. */
  base?: string;
  /** Starlight locales, normalized. */
  locales: LocaleDef[];
}

const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.markdown']);

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (DOC_EXTENSIONS.has(extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

/** Approximate Markdown/MDX → plain text for search ranking and snippets. */
export function stripMarkdown(input: string): string {
  return input
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '') // stray frontmatter (gray-matter already strips the real one; handle CRLF)
    .replace(/^(import|export)\s.*$/gm, '') // MDX import/export
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ') // HTML/JSX tags
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/[*_~>#-]+/g, ' ') // emphasis / blockquote / list markers
    .replace(/\s+/g, ' ')
    .trim();
}

function toPosix(p: string): string {
  return p.split(/[\\/]/).join('/');
}

/**
 * Drop the leading MDX import block from a page body so `get_page` returns
 * readable Markdown instead of module plumbing. Only complete single-line
 * `import … from '…'` statements (and blank lines between them) are removed,
 * so multi-line statements and code fences are never touched.
 */
export function stripLeadingMdxImports(body: string): string {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && (lines[i].trim() === '' || /^import\s.+['"];?\s*$/.test(lines[i]))) {
    i++;
  }
  return lines.slice(i).join('\n');
}

/**
 * Slugify a single path segment exactly as Astro does. Astro maps each path
 * segment through github-slugger's `slug()`
 * (`astro/dist/content/utils.js` → `rawSlugSegments.map(githubSlug)`), so using
 * the same function keeps the index `path`/`url` aligned with real site routes
 * for punctuated filenames (`v1.2 Release` → `v12-release`, `C++ Guide` →
 * `c-guide`, `a--b` → `a--b`).
 */
function slugifySegment(seg: string): string {
  return githubSlug(seg);
}

export function buildDocsIndex(opts: BuildIndexOptions): DocEntry[] {
  const { docsDir, site, base = '/', locales } = opts;
  const rootLocale = locales.find((l) => l.isRoot);
  const localeByKey = new Map(locales.filter((l) => !l.isRoot).map((l) => [l.key, l]));
  const basePrefix = base === '/' ? '' : base.replace(/\/+$/, '');

  const entries: DocEntry[] = [];

  for (const file of walk(docsDir)) {
    const rel = toPosix(relative(docsDir, file)).replace(/\.(md|mdx|markdown)$/i, '');
    const segments = rel.split('/');
    if (segments[segments.length - 1]?.toLowerCase() === 'index') segments.pop();

    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const { data, content } = matter(raw);
    if (data.draft === true) continue;

    // A frontmatter `slug` replaces the file-derived route entirely (Starlight
    // uses it verbatim, no slugification). Locale detection runs on the route
    // segments so it works for both derivations.
    const slugOverride =
      typeof data.slug === 'string' ? data.slug.trim().replace(/^\/+|\/+$/g, '') : undefined;
    const routeSegments =
      slugOverride !== undefined
        ? slugOverride === ''
          ? []
          : slugOverride.split('/')
        : segments.map(slugifySegment);

    // For file-derived routes the locale key is the raw first directory segment;
    // for slug overrides it is the first slug segment (e.g. `slug: es/guia`).
    const localeKeyCandidate = slugOverride !== undefined ? routeSegments[0] : segments[0];
    const localeMatch =
      localeKeyCandidate !== undefined ? localeByKey.get(localeKeyCandidate) : undefined;
    const lang = localeMatch ? localeMatch.lang : (rootLocale?.lang ?? 'en');

    const path = (basePrefix + '/' + routeSegments.join('/'))
      .replace(/\/{2,}/g, '/')
      .replace(/\/?$/, '/'); // always trailing slash (Starlight default)

    const title = typeof data.title === 'string' && data.title.trim()
      ? data.title.trim()
      : (segments[segments.length - 1] ?? 'Untitled');

    const access: AccessLevel = data.access === 'internal' ? 'internal' : 'public';
    const groups = Array.isArray(data.groups) ? data.groups.map((g) => String(g)) : [];

    const url = site
      ? (() => {
          try {
            return new URL(path, site).href;
          } catch {
            return path;
          }
        })()
      : path;

    // Prepend the frontmatter title as an H1 unless the body already opens with
    // one (some pages repeat their title as a Markdown heading).
    const body = stripLeadingMdxImports(content).trim();
    const markdown = /^#\s/.test(body) ? `${body}\n` : `# ${title}\n\n${body}\n`;

    entries.push({
      title,
      url,
      path,
      lang,
      access,
      groups,
      text: stripMarkdown(content),
      markdown,
    });
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

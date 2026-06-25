/**
 * Generate route-manifest.json and sidebar.json from content files.
 *
 * This script scans src/content/{docs,blog,changelog} directories,
 * reads frontmatter from each .mdx file, and generates:
 *   - route-manifest.json, used by the [...slug].md.ts endpoint to serve
 *     markdown versions.
 *   - sidebar.json, the Starlight docs navigation imported by astro.config.mjs.
 *     The sidebar is derived entirely from the docs frontmatter (slug structure,
 *     `sidebar.order`, `sidebar.hidden`, and `sidebar.label`) so the nav can no
 *     longer silently drift from the content files.
 *
 * Run with: npm run generate:manifest
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { ContentType, RouteManifestEntry } from '../src/lib/route-manifest';

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'lib', 'generated', 'route-manifest.json');
const SIDEBAR_OUTPUT_PATH = path.join(process.cwd(), 'src', 'lib', 'generated', 'sidebar.json');

interface DocsFrontmatter {
  title: string;
  description?: string;
  slug: string;
  sidebar?: {
    hidden?: boolean;
    order?: number;
    /**
     * Overrides the nav label for this page. Falls back to `title`.
     * When this page is the index of a group (its slug is the group's
     * directory path), this also overrides the group's label.
     */
    label?: string;
  };
}

interface BlogFrontmatter {
  title: string;
  description?: string;
  date?: string;
  tag?: string;
  section?: string;
  hidden?: boolean;
}

interface ChangelogFrontmatter {
  title: string;
  subtitle?: string;
  date?: string;
  hidden?: boolean;
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSectionFromSlug(slug: string): string {
  // slug format: "docs/getting-started/welcome" → "Getting Started"
  const parts = slug.split('/');
  if (parts.length >= 2) {
    return toTitleCase(parts[1]);
  }
  return 'Docs';
}

// Small words that stay lowercase in a title unless they lead the title.
// Used to derive group/section labels from slug segments (e.g.
// "security-and-privacy" → "Security and Privacy") when no index page
// supplies an explicit label.
const TITLE_SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on',
  'or', 'the', 'to', 'vs', 'with',
]);

function smartTitleCase(segment: string): string {
  return segment
    .split('-')
    .map((word, index) => {
      if (index !== 0 && TITLE_SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Sidebar generation
//
// The Starlight docs nav (src/lib/generated/sidebar.json) is derived entirely
// from the docs frontmatter so it can never silently drift from the content
// files again. The shape of the tree comes from each page's `slug`, and each
// page's `sidebar.order` / `sidebar.hidden` / `sidebar.label` controls
// placement, visibility, and display text.
//
// Slug → tree:
//   docs/<section>                       → section index page
//   docs/<section>/<page>                → leaf, or a group index when other
//                                          pages live under docs/<section>/<page>/
//   docs/<section>/<group>/<page>        → leaf inside that group
//
// A container's label comes from its index page's `sidebar.label ?? title`
// when one exists, otherwise from smart-title-casing its slug segment. A
// container's sort position uses the smallest order anywhere beneath it
// (including its index page). Hidden pages are dropped before the tree is
// built, so empty sections/groups disappear automatically.
// ---------------------------------------------------------------------------

interface DocsNavEntry {
  slug: string;
  label: string;
  order: number;
  hidden: boolean;
}

interface SidebarLeaf {
  label: string;
  slug: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

type SidebarItem = SidebarLeaf | SidebarGroup;

interface TreeNode {
  segment: string;
  page?: DocsNavEntry;
  children: Map<string, TreeNode>;
}

async function collectDocsNavEntries(): Promise<DocsNavEntry[]> {
  const entries: DocsNavEntry[] = [];
  const docsDir = path.join(CONTENT_ROOT, 'docs', 'docs');
  const files = await getAllFiles(docsDir, '.mdx');

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf8');
      const { data } = matter(content);
      const fm = data as DocsFrontmatter;

      if (!fm.slug || !fm.title) {
        console.warn(`Skipping ${filePath}: missing slug or title`);
        continue;
      }

      entries.push({
        slug: fm.slug,
        label: fm.sidebar?.label ?? fm.title,
        order: fm.sidebar?.order ?? 999,
        hidden: fm.sidebar?.hidden ?? false,
      });
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  return entries;
}

function buildTree(entries: DocsNavEntry[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();

  for (const entry of entries) {
    // Slugs are rooted at "docs/"; the remaining segments define the tree.
    const segments = entry.slug.split('/').slice(1);
    if (segments.length === 0) continue;

    let level = root;
    let node: TreeNode | undefined;
    for (const segment of segments) {
      if (!level.has(segment)) {
        level.set(segment, { segment, children: new Map() });
      }
      node = level.get(segment)!;
      level = node.children;
    }
    if (node) node.page = entry;
  }

  return root;
}

function nodeOrder(node: TreeNode): number {
  // A container sorts by the smallest order anywhere beneath it, including its
  // own index page. Index pages normally carry the smallest order in a group,
  // so they lead the group and the group lands in the right spot.
  let min = node.page ? node.page.order : Number.POSITIVE_INFINITY;
  for (const child of node.children.values()) {
    min = Math.min(min, nodeOrder(child));
  }
  return min;
}

function containerLabel(node: TreeNode): string {
  if (node.page) return node.page.label;
  return smartTitleCase(node.segment);
}

function itemLabel(item: SidebarItem): string {
  return item.label;
}

function renderNode(node: TreeNode): SidebarItem {
  // A node with no children is a plain page link.
  if (node.children.size === 0) {
    return { label: node.page!.label, slug: node.page!.slug };
  }

  // Otherwise it's a group. Its own index page (if any) becomes the first
  // item by virtue of having the smallest order in the group.
  const ordered: Array<{ item: SidebarItem; order: number }> = [];
  if (node.page) {
    ordered.push({
      item: { label: node.page.label, slug: node.page.slug },
      order: node.page.order,
    });
  }
  for (const child of node.children.values()) {
    ordered.push({ item: renderNode(child), order: nodeOrder(child) });
  }

  ordered.sort((a, b) => a.order - b.order || itemLabel(a.item).localeCompare(itemLabel(b.item)));

  return { label: containerLabel(node), items: ordered.map((entry) => entry.item) };
}

function buildSidebar(entries: DocsNavEntry[]): SidebarItem[] {
  const visible = entries.filter((entry) => !entry.hidden);
  const root = buildTree(visible);

  return [...root.values()]
    .map((node) => ({ node, order: nodeOrder(node) }))
    .sort((a, b) => a.order - b.order || containerLabel(a.node).localeCompare(containerLabel(b.node)))
    .map(({ node }) => renderNode(node));
}

async function getAllFiles(dir: string, extension: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  await walk(dir);
  return files;
}

async function processDocsContent(): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = [];
  const docsDir = path.join(CONTENT_ROOT, 'docs', 'docs');
  const files = await getAllFiles(docsDir, '.mdx');

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf8');
      const { data } = matter(content);
      const fm = data as DocsFrontmatter;

      if (!fm.slug || !fm.title) {
        console.warn(`Skipping ${filePath}: missing slug or title`);
        continue;
      }

      const relativePath = path.relative(docsDir, filePath);
      const sourcePath = `src/content/docs/docs/${relativePath}`;

      entries.push({
        sourcePath,
        contentType: 'docs' as ContentType,
        routePath: `/${fm.slug}`,
        title: fm.title,
        hidden: fm.sidebar?.hidden ?? false,
        order: fm.sidebar?.order ?? 999,
        section: getSectionFromSlug(fm.slug),
        tab: 'docs',
        ...(fm.description && { description: fm.description }),
      });
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  return entries;
}

async function processBlogContent(): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = [];
  const blogDir = path.join(CONTENT_ROOT, 'blog');
  const files = await getAllFiles(blogDir, '.mdx');

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf8');
      const { data } = matter(content);
      const fm = data as BlogFrontmatter;

      if (!fm.title) {
        console.warn(`Skipping ${filePath}: missing title`);
        continue;
      }

      const relativePath = path.relative(blogDir, filePath);
      const routeSlug = relativePath.replace(/\.mdx$/, '');
      const sourcePath = `src/content/blog/${relativePath}`;

      // Section from frontmatter or derive from folder
      const folderSection = path.dirname(relativePath);
      const section = fm.section || fm.tag || toTitleCase(folderSection);

      entries.push({
        sourcePath,
        contentType: 'blog' as ContentType,
        routePath: `/blog/${routeSlug}`,
        title: fm.title,
        hidden: fm.hidden ?? false,
        order: 999, // Blog posts are typically sorted by date, not order
        section,
        tab: 'blog',
        ...(fm.description && { description: fm.description }),
        ...(fm.date && { date: fm.date }),
      });
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  return entries;
}

async function processChangelogContent(): Promise<RouteManifestEntry[]> {
  const entries: RouteManifestEntry[] = [];
  const changelogDir = path.join(CONTENT_ROOT, 'changelog');
  const files = await getAllFiles(changelogDir, '.mdx');

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf8');
      const { data } = matter(content);
      const fm = data as ChangelogFrontmatter;

      if (!fm.title) {
        console.warn(`Skipping ${filePath}: missing title`);
        continue;
      }

      const relativePath = path.relative(changelogDir, filePath);
      const routeSlug = relativePath.replace(/\.mdx$/, '');
      const sourcePath = `src/content/changelog/${relativePath}`;

      entries.push({
        sourcePath,
        contentType: 'changelog' as ContentType,
        routePath: `/changelog/${routeSlug}`,
        title: fm.title,
        hidden: fm.hidden ?? false,
        order: 999, // Changelog entries are sorted by date
        section: 'Changelogs',
        tab: 'changelog',
        ...(fm.date && { date: fm.date }),
      });
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  return entries;
}

async function main() {
  console.log('Generating route manifest...');

  const [docsEntries, blogEntries, changelogEntries] = await Promise.all([
    processDocsContent(),
    processBlogContent(),
    processChangelogContent(),
  ]);

  // Sort all entries by order (for docs) and then alphabetically
  const allEntries = [...docsEntries, ...blogEntries, ...changelogEntries];

  // Sort docs by order, then blog/changelog by date (newest first)
  allEntries.sort((a, b) => {
    // Group by content type first
    const typeOrder: Record<ContentType, number> = { docs: 0, blog: 1, changelog: 2 };
    const typeCompare = typeOrder[a.contentType] - typeOrder[b.contentType];
    if (typeCompare !== 0) return typeCompare;

    // Within docs, sort by order
    if (a.contentType === 'docs') {
      return a.order - b.order;
    }

    // Within blog/changelog, sort by date (newest first)
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }

    return 0;
  });

  // Assign sequential order numbers based on final sort position
  allEntries.forEach((entry, index) => {
    entry.order = index + 1;
  });

  await writeFile(OUTPUT_PATH, JSON.stringify(allEntries, null, 2) + '\n');

  console.log(`Generated ${allEntries.length} entries:`);
  console.log(`  - Docs: ${docsEntries.length}`);
  console.log(`  - Blog: ${blogEntries.length}`);
  console.log(`  - Changelog: ${changelogEntries.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);

  // Generate the docs sidebar nav from the same frontmatter.
  const navEntries = await collectDocsNavEntries();
  const sidebar = buildSidebar(navEntries);
  await writeFile(SIDEBAR_OUTPUT_PATH, JSON.stringify(sidebar, null, 2) + '\n');

  const visibleCount = navEntries.filter((entry) => !entry.hidden).length;
  console.log(`Generated sidebar with ${sidebar.length} top-level sections (${visibleCount} visible pages)`);
  console.log(`Output: ${SIDEBAR_OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to generate manifest:', err);
  process.exit(1);
});

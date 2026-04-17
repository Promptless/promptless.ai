/**
 * Generate route-manifest.json from content files.
 *
 * This script scans src/content/{docs,blog,changelog} directories,
 * reads frontmatter from each .mdx file, and generates a manifest
 * used by the [...slug].md.ts endpoint to serve markdown versions.
 *
 * Run with: npm run generate:manifest
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { ContentType, RouteManifestEntry } from '../src/lib/route-manifest';

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'lib', 'generated', 'route-manifest.json');

interface DocsFrontmatter {
  title: string;
  description?: string;
  slug: string;
  sidebar?: {
    hidden?: boolean;
    order?: number;
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
}

main().catch((err) => {
  console.error('Failed to generate manifest:', err);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getHiddenRouteManifestPaths(routeManifest) {
  return new Set(
    routeManifest
      .filter((route) => route.hidden)
      .map((route) => normalizePathname(route.routePath))
  );
}

export function getHiddenWebsitePaths(contentDir) {
  const directoryPath = contentDir instanceof URL ? fileURLToPath(contentDir) : contentDir;
  const hiddenPaths = new Set();

  for (const filePath of getMarkdownFiles(directoryPath)) {
    const { data } = matter(fs.readFileSync(filePath, 'utf8'));

    if (data.hidden && typeof data.routePath === 'string') {
      hiddenPaths.add(normalizePathname(data.routePath));
    }
  }

  return hiddenPaths;
}

export function getHiddenDocsPaths(contentDir) {
  const directoryPath = contentDir instanceof URL ? fileURLToPath(contentDir) : contentDir;
  const hiddenPaths = new Set();

  for (const filePath of getMarkdownFiles(directoryPath)) {
    const { data } = matter(fs.readFileSync(filePath, 'utf8'));

    if (data?.sidebar?.hidden && typeof data.slug === 'string') {
      hiddenPaths.add(normalizePathname(`/${data.slug}`));
    }
  }

  return hiddenPaths;
}

export function createSitemapPathFilter(hiddenPaths) {
  return (page) => {
    const pathname = normalizePathname(new URL(page).pathname);
    return !hiddenPaths.has(pathname);
  };
}

function getMarkdownFiles(directoryPath) {
  const files = [];

  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(entryPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      files.push(entryPath);
    }
  }

  return files;
}

import routeManifest from './generated/route-manifest.json';
import type { RouteManifestEntry } from './route-manifest';

export const routeEntries = (routeManifest as RouteManifestEntry[]).slice();

export function sortByManifestOrder(contentType: RouteManifestEntry['contentType']) {
  return routeEntries
    .filter((entry) => entry.contentType === contentType)
    .sort((a, b) => a.order - b.order);
}

export function normalizeRoutePath(path: string): string {
  if (!path.startsWith('/')) return `/${path}`;
  return path;
}

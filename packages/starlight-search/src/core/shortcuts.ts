import type { SearchShortcut } from './types';

export function isShortcut(value: unknown): value is SearchShortcut {
  if (!value || typeof value !== 'object') return false;
  const link = value as SearchShortcut;
  return typeof link.url === 'string' && /^\/(?!\/)/.test(link.url) && !/[\\\u0000-\u0020]/.test(link.url) && link.url.length <= 1_000 &&
    typeof link.title === 'string' && Boolean(link.title.trim()) && link.title.length <= 200 &&
    (link.description === undefined || (typeof link.description === 'string' && link.description.length <= 300));
}

export function starterLinks(links: Record<string, SearchShortcut[]> = {}, base = '/') {
  return Object.fromEntries(Object.entries(links).map(([locale, entries]) => {
    if (!Array.isArray(entries) || entries.length > 4 || !entries.every(isShortcut)) {
      throw new Error(`Search starterLinks.${locale} must contain up to four titled, same-site paths with optional short descriptions.`);
    }
    return [locale, entries.map((entry) => ({ ...entry, url: base.replace(/\/$/, '') + entry.url }))];
  }));
}

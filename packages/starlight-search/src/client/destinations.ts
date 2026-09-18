import type { SearchShortcut } from '../core/types';
import { isShortcut } from '../core/shortcuts';
import { readSession, writeSession } from './session';

interface Destination extends SearchShortcut { locale: string }
const KEY = 'starport:recent-destinations:v1';

export function recentDestinations(): Destination[] {
  const saved = readSession<unknown>(KEY, []);
  return Array.isArray(saved) ? saved.filter((entry): entry is Destination => isShortcut(entry) &&
    typeof (entry as Destination).locale === 'string' && (entry as Destination).locale.length <= 40)
    .slice(0, 12).map(({ url, title, description, locale }) => ({ url, title, description, locale })) : [];
}

export function rememberDestination(link: SearchShortcut, locale: string): Destination[] {
  if (!isShortcut(link) || locale.length > 40) return recentDestinations();
  const recent = [{ ...link, locale }, ...recentDestinations().filter((entry) => entry.url !== link.url || entry.locale !== locale)].slice(0, 12);
  writeSession(KEY, recent);
  return recent;
}

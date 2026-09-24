/** Fallback URL segments need readable labels; authored sidebar labels stay untouched. */
export function fallbackBreadcrumbs(path: string, locale: string): string[] {
  const segments = path.split('/').filter(Boolean).slice(0, -1).filter((part) => part !== locale);
  const labels = segments.map((part) => {
    const words = decodeURIComponent(part).replace(/[-_]/g, ' ');
    if (/^changelogs?$/i.test(words)) return locale.startsWith('es') ? 'Novedades' : 'Changelog';
    if (/^api$/i.test(words)) return 'API';
    return words.charAt(0).toLocaleUpperCase(locale) + words.slice(1);
  });
  return labels.filter((label, i) => label !== labels[i - 1]);
}

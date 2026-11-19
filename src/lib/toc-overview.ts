/**
 * Starlight always starts the "On this page" list with an entry for the top of
 * the page, labeled with the `tableOfContents.overview` UI string ("Overview").
 * Pages built from the how-to template (and others) also open with an
 * `## Overview` heading, so the list showed "Overview" twice.
 *
 * When the first heading's text matches the top entry's label, drop that
 * heading's entry and keep the top entry, so the list shows "Overview" once and
 * it still links to the top of the page. Any subheadings of the dropped entry
 * move under the top entry.
 */
export interface TocItemLike {
  depth: number;
  slug: string;
  text: string;
  children: TocItemLike[];
}

const normalize = (text: string) => text.trim().toLowerCase();

export function dedupeOverviewTocItem<T extends TocItemLike>(items: T[], topSlug = '_top'): T[] {
  const [top, next, ...rest] = items;
  if (!top || !next || top.slug !== topSlug) return items;
  if (normalize(top.text) !== normalize(next.text)) return items;
  return [{ ...top, children: [...top.children, ...next.children] }, ...rest];
}

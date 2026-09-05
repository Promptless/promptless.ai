import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { Page, SearchOptions, Section } from './types';

const markdown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
markdown.use(gfm);

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();
const inPaths = (path: string, prefixes: string[]) => prefixes.some((prefix) => path === prefix || path.startsWith(prefix.replace(/\/$/, '') + '/'));

export function excludedPath(path: string, exclusions: string[] = []) {
  return /(?:^|\/)(?:404|internal|_internal)(?:\/|$)/.test(path) || exclusions.some((pattern) =>
    pattern.endsWith('/*') ? inPaths(path, [pattern.slice(0, -2)]) : path.replace(/\/$/, '') === pattern.replace(/\/$/, ''));
}

/** Extract published main content; never derive headings or API text from MDX sources. */
export function extractPage(html: string, path: string, options: SearchOptions = {}): Page | null {
  if (excludedPath(path, options.exclude)) return null;
  const $ = load(html);
  if ($('meta[name="robots"], meta[name="googlebot"]').toArray().some((node) => /\bnoindex\b/i.test($(node).attr('content') ?? '')) ||
      $('meta[http-equiv]').toArray().some((node) => $(node).attr('http-equiv')?.toLowerCase() === 'refresh') ||
      $('[data-starport-exclude-page]').length) return null;

  const main = $('main').first();
  if (!main.length || main.is('[data-pagefind-ignore], [data-search-exclude]')) return null;
  // Starlight omits this marker for pagefind:false, even with its own search disabled.
  if ($('[data-starport-page]').length && !main.is('[data-pagefind-body]')) return null;
  const title = cleanText(main.find('h1').first().text() || $('title').text().split('|')[0] || path);
  // The route language includes Starlight's fallback pages in their browsed locale.
  const locale = $('html').attr('lang') || main.attr('lang') || 'en';
  const active = $('#starlight__sidebar a[aria-current="page"]').first();
  const breadcrumbs = active.parents('details').toArray().reverse().map((node) => cleanText($(node).children('summary').text()));
  if (!breadcrumbs.length) {
    const segments = path.split('/').filter(Boolean).slice(0, -1);
    breadcrumbs.push(...segments.map((part) => decodeURIComponent(part).replace(/[-_]/g, ' ')));
  }
  main.find('script, style, noscript, nav, footer, button, input, select, textarea, svg, [hidden], [aria-hidden="true"], [data-pagefind-ignore], [data-search-exclude], .copy, .sr-only, .visually-hidden, .sl-anchor-link, #dropdown-menu').remove();
  // Resolve links against the page, retaining same-site path/anchor identities.
  main.find('a[href]').each((_, node) => {
    const href = $(node).attr('href')!;
    let url: URL;
    try { url = new URL(href, `https://starport.invalid${path}`); }
    catch { $(node).removeAttr('href'); return; }
    if (url.origin === 'https://starport.invalid') $(node).attr('href', url.pathname + url.search + url.hash);
    else if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) $(node).removeAttr('href');
  });

  const sections: Section[] = [];
  let current = { id: '', heading: title, html: '' };
  const flush = () => {
    const body = markdown.turndown(current.html).trim();
    const fragment = load(current.html);
    const renderedText = (node: AnyNode): string => {
      if (node.type === 'text') return node.data;
      if (node.type !== 'tag') return '';
      // Syntax-highlighter spans must not insert spaces inside code identifiers.
      if (node.name === 'code' || node.name === 'pre') return fragment(node).text() + ' ';
      const value = fragment(node).contents().toArray().map(renderedText).join('');
      return /^(div|p|li|td|th|section|article|table|details|summary|dt|dd|span|br|h[1-6])$/.test(node.name) ? value + ' ' : value;
    };
    const text = cleanText(fragment('body').contents().toArray().map(renderedText).join(''));
    if (body || !sections.length) sections.push({ id: current.id, heading: current.heading, markdown: body, text });
  };
  const visit = (node: AnyNode) => {
    if (node.type === 'tag' && /^h[1-6]$/.test(node.name) && $(node).attr('id')) {
      if (node.name === 'h1') return;
      flush();
      current = { id: $(node).attr('id')!, heading: cleanText($(node).clone().find('span').prepend(' ').end().text()), html: '' };
    } else if (node.type === 'tag' && $(node).find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').length) {
      $(node).contents().each((_, child) => { visit(child); });
    } else {
      current.html += $.html(node);
    }
  };
  main.contents().each((_, node) => { visit(node); });
  flush();
  if (!sections.some((section) => section.text.length > 10)) return null;
  const type = inPaths(path, options.apiPaths ?? ['/api']) ? 'api'
    : inPaths(path, ['/blog', '/changelog']) ? 'blog'
    : inPaths(path, options.docsPaths ?? ['/docs', '/getting-started', '/guides', '/es']) ? 'docs' : 'marketing';
  return { id: path, title, locale, type, breadcrumbs, sections };
}

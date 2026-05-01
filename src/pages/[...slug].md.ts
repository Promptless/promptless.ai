import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { APIRoute, GetStaticPaths } from 'astro';
import matter from 'gray-matter';
import { routeEntries } from '@lib/content-order';
import type { RouteManifestEntry } from '@lib/route-manifest';

function stripMdxImports(body: string): string {
  return body
    .split('\n')
    .filter((line) => !line.startsWith('import ') && !line.startsWith('export '))
    .join('\n');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`${name}=(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

function normalizeInlineMarkup(fragment: string): string {
  return decodeHtmlEntities(
    fragment
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _quote, href, label) => {
        const inlineLabel = normalizeInlineMarkup(label).trim();
        return inlineLabel ? `[${inlineLabel}](${href})` : href;
      })
      .replace(/<img\b[^>]*\/?>/gi, (tag) => {
        const src = getAttribute(tag, 'src');
        if (!src) return '';
        const alt = decodeHtmlEntities(getAttribute(tag, 'alt') ?? '');
        return `![${alt}](${src})`;
      })
      .replace(/<\/?(span|small|sup|sub)[^>]*>/gi, '')
      .replace(/<\/?[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>/g, '')
      .replace(/<\/?[^>]+>/g, ''),
  );
}

function normalizeMdxForMarkdown(body: string): string {
  const withoutImports = stripMdxImports(body);

  const normalized = withoutImports
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<BlogNewsletterCTA\s*\/>/g, '\n\n*We regularly share actionable insights grounded in research, experiments, and real-world product learnings. [Subscribe to get future posts in your inbox](/blog).*\n\n')
    .replace(/<BlogRequestDemo\s*\/>/g, '\n\n[Book a demo](https://promptless.ai/meet#book)\n\n')
    .replace(/<Card\b([^>]*)>/g, (_match, attrs) => {
      const title = getAttribute(attrs, 'title');
      return title ? `\n### ${decodeHtmlEntities(title)}\n` : '\n';
    })
    .replace(/<\/Card>/g, '\n')
    .replace(/<Frame\b([^>]*)>/g, (_match, attrs) => {
      const caption = getAttribute(attrs, 'caption');
      return caption ? `\n${decodeHtmlEntities(caption)}\n` : '\n';
    })
    .replace(/<\/Frame>/g, '\n')
    .replace(/<Step\b([^>]*)>/g, (_match, attrs) => {
      const title = getAttribute(attrs, 'title');
      return title ? `\n**${decodeHtmlEntities(title)}**\n` : '\n';
    })
    .replace(/<\/Step>/g, '\n')
    .replace(/<Accordion\b([^>]*)>/g, (_match, attrs) => {
      const title = getAttribute(attrs, 'title');
      return title ? `\n**${decodeHtmlEntities(title)}**\n` : '\n';
    })
    .replace(/<\/Accordion>/g, '\n')
    .replace(/<(Note|Info|Tip|Warning|CardGroup|Steps|AccordionGroup)\b[^>]*>/g, '\n')
    .replace(/<\/(Note|Info|Tip|Warning|CardGroup|Steps|AccordionGroup)>/g, '\n')
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, content) => {
      return `\n${'#'.repeat(Number(level))} ${normalizeInlineMarkup(content).trim()}\n`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, content) => {
      return `\n- ${normalizeInlineMarkup(content).trim()}`;
    })
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_match, content) => {
      return `\n${normalizeInlineMarkup(content).trim()}\n`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(section|div|article|ul|ol)[^>]*>/gi, '\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<img\b[^>]*\/?>/gi, (tag) => normalizeInlineMarkup(tag))
    .replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _quote, href, label) => {
      const inlineLabel = normalizeInlineMarkup(label).trim();
      return inlineLabel ? `[${inlineLabel}](${href})` : href;
    })
    .replace(/<\/?[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>/g, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return decodeHtmlEntities(normalized).trim();
}

function contentPathFromRoute(route: RouteManifestEntry): string {
  if (route.contentType === 'docs') {
    return path.join(
      process.cwd(),
      'src',
      'content',
      'docs',
      `${route.routePath.replace(/^\//, '')}.mdx`,
    );
  }
  if (route.contentType === 'blog') {
    return path.join(
      process.cwd(),
      'src',
      'content',
      'blog',
      `${route.routePath.replace(/^\/blog\//, '')}.mdx`,
    );
  }
  return path.join(
    process.cwd(),
    'src',
    'content',
    'changelog',
    `${route.routePath.replace(/^\/changelog\//, '')}.mdx`,
  );
}

export const getStaticPaths: GetStaticPaths = () => {
  return routeEntries
    .filter((entry) => !entry.hidden)
    .map((entry) => ({
      params: { slug: entry.routePath.replace(/^\//, '') },
      props: { entry },
    }));
};

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as RouteManifestEntry;
  const filePath = contentPathFromRoute(entry);

  try {
    const raw = await readFile(filePath, 'utf8');
    const body = normalizeMdxForMarkdown(matter(raw).content);

    const lines: string[] = [`# ${entry.title}`];
    lines.push('', '> For the complete documentation index, see [llms.txt](/llms.txt).');
    if (entry.description) lines.push('', entry.description);
    if (body) lines.push('', body);

    if (entry.contentType === 'blog') {
      const category = entry.routePath.split('/')[2] ?? '';
      const allBlog = routeEntries.filter((e) => e.contentType === 'blog' && !e.hidden && e.routePath !== entry.routePath);
      const sameCategory = allBlog.filter((e) => e.routePath.split('/')[2] === category);
      const different = allBlog.filter((e) => e.routePath.split('/')[2] !== category);
      const related = [...sameCategory, ...different].slice(0, 3);
      if (related.length > 0) {
        lines.push('', '## More from the blog');
        for (const post of related) {
          const postCategory = post.routePath.split('/')[2] ?? '';
          const tag = postCategory.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          lines.push(`- [${post.title}](${post.routePath})${tag}`);
        }
      }
    }

    if (entry.contentType === 'changelog') {
      const allChangelog = routeEntries.filter((e) => e.contentType === 'changelog' && !e.hidden);
      const idx = allChangelog.findIndex((e) => e.routePath === entry.routePath);
      const newer = idx > 0 ? allChangelog[idx - 1] : null;
      const older = idx >= 0 && idx < allChangelog.length - 1 ? allChangelog[idx + 1] : null;
      if (older || newer) {
        lines.push('');
        if (older) lines.push(`← Older [${older.title}](${older.routePath})`);
        if (newer) lines.push(`Newer → [${newer.title}](${newer.routePath})`);
      }
    }

    return new Response(lines.join('\n'), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};

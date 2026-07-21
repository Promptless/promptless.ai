import { z } from 'zod';
import type { McpContext } from '../context';
import { searchDocs } from '../index/query';

/** Zod input shape for the `search` tool. The SDK derives the wire JSON Schema from this. */
export const searchInputSchema = {
  query: z.string().min(1).describe('Search query.'),
  lang: z.string().optional().describe('Optional language filter (e.g. "en", "es"). Omit to search all languages.'),
  limit: z.number().int().min(1).max(50).optional().describe('Maximum number of results (1–50, default 10).'),
};

export const searchToolConfig = {
  title: 'Search documentation',
  description:
    'Full-text search across the documentation. Returns ranked passages with their source page titles and URLs. Use this to find where a topic is covered before reading a full page with `get_page`.',
  inputSchema: searchInputSchema,
  annotations: { readOnlyHint: true, openWorldHint: false },
};

export interface SearchArgs {
  query: string;
  lang?: string;
  limit?: number;
}

export function runSearch(args: SearchArgs, ctx: McpContext) {
  const results = searchDocs(ctx.index, ctx.identity, {
    query: args.query,
    lang: args.lang,
    limit: args.limit,
  });

  if (results.length === 0) {
    return {
      content: [{ type: 'text' as const, text: `No documentation matched "${args.query}".` }],
      structuredContent: { results: [] },
    };
  }

  const text = results
    .map((r, i) => `${i + 1}. ${r.title} — ${r.url}\n   ${r.snippet}`)
    .join('\n\n');

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      results: results.map((r) => ({
        title: r.title,
        url: r.url,
        path: r.path,
        lang: r.lang,
        snippet: r.snippet,
      })),
    },
  };
}

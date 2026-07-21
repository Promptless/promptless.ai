import { z } from 'zod';
import type { McpContext } from '../context';
import { getPage } from '../index/query';

/** Zod input shape for the `get_page` tool. */
export const getPageInputSchema = {
  path: z.string().min(1).describe('The page route path (e.g. "/guides/example/") or its full URL.'),
};

export const getPageToolConfig = {
  title: 'Get a documentation page',
  description:
    'Retrieve the full Markdown content of a single documentation page by its path (e.g. "/getting-started/welcome/") or full URL. Use `search` first to discover the path.',
  inputSchema: getPageInputSchema,
  annotations: { readOnlyHint: true, openWorldHint: false },
};

export interface GetPageArgs {
  path: string;
}

export function runGetPage(args: GetPageArgs, ctx: McpContext) {
  const entry = getPage(ctx.index, ctx.identity, args.path);
  if (!entry) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `No documentation page found at "${args.path}".` }],
    };
  }

  return {
    content: [{ type: 'text' as const, text: entry.markdown }],
    structuredContent: {
      title: entry.title,
      url: entry.url,
      path: entry.path,
      lang: entry.lang,
      markdown: entry.markdown,
    },
  };
}

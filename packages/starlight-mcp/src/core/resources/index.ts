/**
 * MCP resources. v1 exposes a single `llms.txt`-style index resource, generated
 * from the visible content index (so it respects the same identity gating as the
 * tools and needs no dependency on the `starlight-llms-txt` build output).
 */
import type { McpContext } from '../context';
import { visibleTo } from '../index/query';

const LLMS_TXT_NAME = 'llms.txt';

export function llmsTxtUri(ctx: McpContext): string {
  if (ctx.siteUrl) {
    try {
      return new URL('/llms.txt', ctx.siteUrl).href;
    } catch {
      /* fall through */
    }
  }
  return 'docs://llms.txt';
}

export function listResources(ctx: McpContext) {
  return [
    {
      uri: llmsTxtUri(ctx),
      name: LLMS_TXT_NAME,
      title: 'Documentation index (llms.txt)',
      description: 'A link index of the documentation, suitable for LLM consumption.',
      mimeType: 'text/plain',
    },
  ];
}

export function renderLlmsTxt(ctx: McpContext): string {
  const title = ctx.siteTitle ?? 'Documentation';
  const lines: string[] = [`# ${title}`, '', '## Docs', ''];
  for (const e of ctx.index.filter((entry) => visibleTo(entry, ctx.identity))) {
    const summary = e.text.replace(/\s+/g, ' ').trim().slice(0, 140);
    lines.push(`- [${e.title}](${e.url})${summary ? `: ${summary}` : ''}`);
  }
  return lines.join('\n') + '\n';
}

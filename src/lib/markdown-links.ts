import { parse, postprocess, preprocess } from 'micromark';
import { decodeString } from 'micromark-util-decode-string';

/** Resolve Markdown destinations against the canonical HTML page URL. */
export function resolveMarkdownLinks(markdown: string, pageUrl: URL): string {
  const events = postprocess(parse().document().write(preprocess()(markdown, undefined, true)));
  let result = markdown;

  // Edit destination tokens only, from the end, so formatting and code examples
  // stay intact. The parser handles reference definitions and escaped syntax.
  for (const [kind, token] of events.reverse()) {
    if (kind !== 'exit' || !['resourceDestinationString', 'definitionDestinationString'].includes(token.type)) continue;

    const start = token.start.offset;
    const end = token.end.offset;
    const href = decodeString(markdown.slice(start, end));
    if (href.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(href)) continue;
    if (!URL.canParse(href, pageUrl)) continue;

    const absolute = new URL(href, pageUrl).href
      .replace(/&/g, '&amp;')
      .replace(/[\\()]/g, '\\$&');
    result = result.slice(0, start) + absolute + result.slice(end);
  }

  return result;
}

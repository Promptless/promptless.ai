import assert from 'node:assert/strict';
import test from 'node:test';
import { micromark } from 'micromark';
import { resolveMarkdownLinks } from '../../src/lib/markdown-links';

const pageUrl = new URL('https://docs.example.com/docs/guide/');

test('resolves relative destinations while preserving queries, fragments, and titles', () => {
  const cases = [
    ['[Index](/llms.txt)', '[Index](https://docs.example.com/llms.txt)'],
    ['[Sibling](../other?mode=full#setup "Read more")', '[Sibling](https://docs.example.com/docs/other?mode=full#setup "Read more")'],
    ['[Child](child.md)', '[Child](https://docs.example.com/docs/guide/child.md)'],
    ['[Query](?mode=full#setup)', '[Query](https://docs.example.com/docs/guide/?mode=full#setup)'],
    ['[Remote](//other.example.com/guide)', '[Remote](https://other.example.com/guide)'],
    ['![Diagram](/images/flow.svg)', '![Diagram](https://docs.example.com/images/flow.svg)'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(resolveMarkdownLinks(input, pageUrl), expected);
  }
});

test('resolves reference definitions and nested linked images', () => {
  const input = '[Guide][guide]\n\n[guide]: </docs/other?mode=full#setup> "Guide"\n\n[![Diagram](/flow.svg)](/docs/flow)';
  const output = resolveMarkdownLinks(input, pageUrl);
  assert.equal(output, '[Guide][guide]\n\n[guide]: <https://docs.example.com/docs/other?mode=full#setup> "Guide"\n\n[![Diagram](https://docs.example.com/flow.svg)](https://docs.example.com/docs/flow)');
});

test('keeps escaped destinations valid after URL resolution', () => {
  const input = String.raw`[API](/api/foo\(bar\)?a=1&amp;b=2#setup)`;
  const output = resolveMarkdownLinks(input, pageUrl);
  assert.equal(micromark(output), '<p><a href="https://docs.example.com/api/foo(bar)?a=1&amp;b=2#setup">API</a></p>');
  assert.equal(resolveMarkdownLinks(output, pageUrl), output);
});

test('preserves code, comments, formatting, and links that need no base URL', () => {
  const input = [
    '[Anchor](#setup) [External](https://example.com/a?b=1&c=2) [Email](mailto:docs@example.com)',
    '`[Inline example](/keep)` and ``[Example with `ticks`](/keep)``',
    '```md\n[Example](/keep)\n```',
    '~~~md\n[Example](/keep)\n~~~',
    '    [Indented example](/keep)',
    '<!-- [Comment](/keep) -->',
    '[Broken](/unclosed',
  ].join('\n\n');
  assert.equal(resolveMarkdownLinks(input, pageUrl), input);
});

test('preserves table layout, Unicode, and CRLF while resolving links', () => {
  const input = '| Café | Guide |\r\n| --- | --- |\r\n| ✓ | [Guide](/docs/guide#setup) |\r\n';
  assert.equal(resolveMarkdownLinks(input, pageUrl), input.replace('](/docs/', '](https://docs.example.com/docs/'));
});

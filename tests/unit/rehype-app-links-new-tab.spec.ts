import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root } from 'hast';
import rehypeAppLinksNewTab from '../../src/lib/rehype-app-links-new-tab';

function anchor(href: string, rel?: string | string[]): Root {
  const properties: Record<string, unknown> = { href };
  if (rel !== undefined) properties.rel = rel;
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties,
        children: [{ type: 'text', value: 'link' }],
      },
    ],
  } as Root;
}

function firstAnchor(tree: Root) {
  return (tree.children[0] as any).properties as Record<string, unknown>;
}

function run(tree: Root): Root {
  rehypeAppLinksNewTab()(tree);
  return tree;
}

test('app links open in a new tab with noopener noreferrer', () => {
  for (const href of [
    'https://app.gopromptless.ai/configuration',
    'https://app.gopromptless.ai',
    'https://app.gopromptless.ai/new-task?deep_analysis=true',
    'https://app.promptless.ai/settings',
    'https://APP.GOPROMPTLESS.AI/integrations',
  ]) {
    const props = firstAnchor(run(anchor(href)));
    assert.equal(props.target, '_blank', `${href} should target _blank`);
    assert.equal(props.rel, 'noopener noreferrer', `${href} should get rel noopener noreferrer`);
  }
});

test('non-app links are left untouched', () => {
  for (const href of [
    'https://github.com/Promptless/promptless',
    'https://promptless.ai/pricing',
    '/docs/connect/triggers',
    'https://gopromptless.ai',
    'https://notapp.gopromptless.ai.evil.com/',
    'mailto:support@gopromptless.ai',
  ]) {
    const props = firstAnchor(run(anchor(href)));
    assert.equal(props.target, undefined, `${href} should not get a target`);
    assert.equal(props.rel, undefined, `${href} should not get a rel`);
  }
});

test('existing rel tokens are preserved and deduped', () => {
  const props = firstAnchor(run(anchor('https://app.gopromptless.ai/configuration', 'nofollow noopener')));
  const tokens = String(props.rel).split(' ').sort();
  assert.deepEqual(tokens, ['nofollow', 'noopener', 'noreferrer']);
  assert.equal(props.target, '_blank');
});

test('rel supplied as an array is normalized to a string', () => {
  const props = firstAnchor(run(anchor('https://app.gopromptless.ai/configuration', ['nofollow'])));
  const tokens = String(props.rel).split(' ').sort();
  assert.deepEqual(tokens, ['nofollow', 'noopener', 'noreferrer']);
});

test('nested app links deep in the tree are rewritten', () => {
  const tree: Root = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'p',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'a',
            properties: { href: 'https://app.gopromptless.ai/integrations' },
            children: [{ type: 'text', value: 'Integrations' }],
          },
        ],
      },
    ],
  } as Root;
  run(tree);
  const inner = ((tree.children[0] as any).children[0] as any).properties;
  assert.equal(inner.target, '_blank');
  assert.equal(inner.rel, 'noopener noreferrer');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { DOCS_PRODUCTS, getActiveDocsProduct } from '../../src/lib/docs-products';

test('documentation product metadata is complete and centrally badges the new product', () => {
  assert.deepEqual(
    DOCS_PRODUCTS.map(({ id, label, href, description, icon, badge }) => ({
      id,
      label,
      href,
      description,
      icon,
      badge,
    })),
    [
      {
        id: 'for_docs',
        label: 'Promptless for Docs',
        href: '/docs/for-docs/start-here/welcome',
        description: 'Keep customer-facing documentation current.',
        icon: 'docs',
        badge: undefined,
      },
      {
        id: 'agent_instructions',
        label: 'Promptless for Agent Instructions',
        href: '/docs/governance',
        description: 'Govern and continuously improve your AI workforce’s instructions.',
        icon: 'agent_instructions',
        badge: 'New',
      },
    ]
  );
});

test('active documentation product follows canonical route prefixes only', () => {
  assert.equal(getActiveDocsProduct('/docs/for-docs/start-here/welcome')?.id, 'for_docs');
  assert.equal(getActiveDocsProduct('/docs/for-docs/api/operations/submitapitrigger/')?.id, 'for_docs');
  assert.equal(getActiveDocsProduct('/docs/governance/')?.id, 'agent_instructions');
  assert.equal(getActiveDocsProduct('/docs/media-kit'), undefined);
  assert.equal(getActiveDocsProduct('/docs/marketing-images'), undefined);
  assert.equal(getActiveDocsProduct('/docs'), undefined);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { dedupeOverviewTocItem } from '../../src/lib/toc-overview';

const item = (slug: string, text: string, children: any[] = []) => ({ depth: 2, slug, text, children });

test('drops an Overview heading that repeats the top-of-page entry', () => {
  const items = [item('_top', 'Overview'), item('overview', 'Overview', [item('scope', 'Scope')]), item('see-also', 'See also')];
  assert.deepEqual(dedupeOverviewTocItem(items), [item('_top', 'Overview', [item('scope', 'Scope')]), item('see-also', 'See also')]);
});

test('keeps the list when the first heading is not Overview', () => {
  const items = [item('_top', 'Overview'), item('use-cases', 'Use cases')];
  assert.deepEqual(dedupeOverviewTocItem(items), items);
});

test('keeps an Overview heading that is not first', () => {
  const items = [item('_top', 'Overview'), item('before', 'Before you start'), item('overview', 'Overview')];
  assert.deepEqual(dedupeOverviewTocItem(items), items);
});

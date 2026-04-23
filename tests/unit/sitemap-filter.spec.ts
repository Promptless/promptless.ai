import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSitemapPathFilter,
  getHiddenDocsPaths,
  getHiddenRouteManifestPaths,
  getHiddenWebsitePaths,
  normalizePathname,
} from '../../src/lib/sitemap-filter.mjs';

test('normalizes sitemap paths consistently', () => {
  assert.equal(normalizePathname('/docs/core-concepts/'), '/docs/core-concepts');
  assert.equal(normalizePathname('/'), '/');
  assert.equal(normalizePathname(''), '/');
});

test('collects hidden route-manifest pages', () => {
  const hiddenPaths = getHiddenRouteManifestPaths([
    { routePath: '/docs/core-concepts', hidden: true },
    { routePath: '/docs/self-hosting', hidden: true },
    { routePath: '/docs/internal/component-fixtures', hidden: true },
    { routePath: '/docs/getting-started/welcome', hidden: false },
  ]);

  assert(hiddenPaths.has('/docs/core-concepts'));
  assert(hiddenPaths.has('/docs/self-hosting'));
  assert(hiddenPaths.has('/docs/internal/component-fixtures'));
  assert(!hiddenPaths.has('/docs/getting-started/welcome'));
});

test('collects hidden website pages', () => {
  const hiddenPaths = getHiddenWebsitePaths(new URL('../../src/content/website/', import.meta.url));

  assert(hiddenPaths.has('/jobs'));
  assert(hiddenPaths.has('/wtd-portland-2026'));
  assert(!hiddenPaths.has('/demo'));
});

test('collects hidden docs pages from source content', () => {
  const hiddenPaths = getHiddenDocsPaths(new URL('../../src/content/docs/', import.meta.url));

  assert(hiddenPaths.has('/docs/internal/component-fixtures'));
  assert(hiddenPaths.has('/docs/core-concepts'));
  assert(hiddenPaths.has('/docs/self-hosting'));
  assert(!hiddenPaths.has('/docs/getting-started/welcome'));
});

test('filters hidden sitemap pages while preserving public ones', () => {
  const hiddenPaths = new Set([
    '/docs/core-concepts',
    '/docs/internal/component-fixtures',
    '/wtd-portland-2026',
  ]);
  const filter = createSitemapPathFilter(hiddenPaths);

  assert.equal(filter('https://promptless.ai/docs/core-concepts/'), false);
  assert.equal(filter('https://promptless.ai/docs/internal/component-fixtures/'), false);
  assert.equal(filter('https://promptless.ai/wtd-portland-2026/'), false);
  assert.equal(filter('https://promptless.ai/demo/'), true);
});

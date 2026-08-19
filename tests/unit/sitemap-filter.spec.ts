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
  assert.equal(normalizePathname('/docs/for-docs/start-here/how-promptless-works/'), '/docs/for-docs/start-here/how-promptless-works');
  assert.equal(normalizePathname('/'), '/');
  assert.equal(normalizePathname(''), '/');
});

test('collects hidden route-manifest pages', () => {
  const hiddenPaths = getHiddenRouteManifestPaths([
    { routePath: '/docs/for-docs/start-here/how-promptless-works', hidden: true },
    { routePath: '/docs/for-docs/security/self-hosting', hidden: true },
    { routePath: '/docs/internal/component-fixtures', hidden: true },
    { routePath: '/docs/for-docs/start-here/welcome', hidden: false },
  ]);

  assert(hiddenPaths.has('/docs/for-docs/start-here/how-promptless-works'));
  assert(hiddenPaths.has('/docs/for-docs/security/self-hosting'));
  assert(hiddenPaths.has('/docs/internal/component-fixtures'));
  assert(!hiddenPaths.has('/docs/for-docs/start-here/welcome'));
});

test('collects hidden website pages', () => {
  const hiddenPaths = getHiddenWebsitePaths(new URL('../../src/content/website/', import.meta.url));

  assert(hiddenPaths.has('/jobs'));
  assert(!hiddenPaths.has('/demo'));
});

test('collects hidden docs pages from source content', () => {
  const hiddenPaths = getHiddenDocsPaths(new URL('../../src/content/docs/', import.meta.url));

  assert(hiddenPaths.has('/docs/internal/component-fixtures'));
  assert(hiddenPaths.has('/docs/for-docs/security/self-hosting'));
  assert(hiddenPaths.has('/docs/for-docs/security/self-hosting/kubernetes-helm'));
  assert(!hiddenPaths.has('/docs/for-docs/start-here/welcome'));
});

test('filters hidden sitemap pages while preserving public ones', () => {
  const hiddenPaths = new Set([
    '/docs/for-docs/start-here/how-promptless-works',
    '/docs/internal/component-fixtures',
  ]);
  const filter = createSitemapPathFilter(hiddenPaths);

  assert.equal(filter('https://promptless.ai/docs/for-docs/start-here/how-promptless-works/'), false);
  assert.equal(filter('https://promptless.ai/docs/internal/component-fixtures/'), false);
  assert.equal(filter('https://promptless.ai/demo/'), true);
});

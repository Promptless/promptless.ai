import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allowTrailingSlash,
  normalizeRedirectRoutes,
  type VercelRoute,
} from '../../src/lib/vercel-redirect-routes';

test('a redirect source matches with or without one trailing slash', () => {
  const pattern = new RegExp(allowTrailingSlash('^/docs/getting-started/welcome$'));

  assert.match('/docs/getting-started/welcome', pattern);
  assert.match('/docs/getting-started/welcome/', pattern);
  assert.doesNotMatch('/docs/getting-started/welcome//', pattern);
  assert.doesNotMatch('/docs/getting-started/welcome/extra', pattern);
  assert.doesNotMatch('/docs/getting-started/welcomes', pattern);
});

test('slash tolerance is idempotent', () => {
  assert.equal(allowTrailingSlash('^/api/?$'), '^/api/?$');
  assert.equal(allowTrailingSlash('^/security-and-privacy/$'), '^/security-and-privacy/?$');
  assert.equal(allowTrailingSlash(allowTrailingSlash('^/faq$')), '^/faq/?$');
});

test('an unanchored source is rejected rather than silently widened', () => {
  assert.throws(() => allowTrailingSlash('/docs/getting-started/welcome'), /anchored/);
});

test('normalization rewrites every redirect route and leaves other routes alone', () => {
  const routes: VercelRoute[] = [
    { src: '^/docs/getting-started/welcome$', headers: { Location: '/docs/for-docs/start-here/welcome' }, status: 301 },
    { src: '^/docs/audit/doc-detective\\.md$', headers: { Location: '/docs/for-docs/audit/doc-detective.md' }, status: 308 },
    { src: '^/api(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$', headers: { Location: '/docs/for-docs/api/$1' }, status: 301 },
    { src: '^/_astro/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    { src: '^/.*$', status: 404 },
  ];

  assert.equal(normalizeRedirectRoutes(routes), 3);
  assert.deepEqual(
    routes.map((route) => route.src),
    [
      '^/docs/getting-started/welcome/?$',
      '^/docs/audit/doc-detective\\.md/?$',
      '^/api(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?/?$',
      '^/_astro/(.*)$',
      '^/.*$',
    ]
  );
  assert.equal(routes[0].headers?.Location, '/docs/for-docs/start-here/welcome');
  assert.equal(routes[2].headers?.Location, '/docs/for-docs/api/$1/');

  const apiPattern = new RegExp(routes[2].src!);
  assert.equal('/api/operations/submitapitrigger/'.match(apiPattern)?.[1], 'operations/submitapitrigger');
  assert.equal('/api/operations/submitapitrigger'.match(apiPattern)?.[1], 'operations/submitapitrigger');
});

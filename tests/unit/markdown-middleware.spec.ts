import assert from 'node:assert/strict';
import test from 'node:test';
import middleware from '../../middleware';

test('markdown middleware rewrites website routes to their markdown variants', () => {
  const cases = [
    ['/', 'https://promptless.ai/index.md'],
    ['/demo', 'https://promptless.ai/demo.md'],
    ['/pricing', 'https://promptless.ai/pricing.md'],
    ['/free-tools', 'https://promptless.ai/free-tools.md'],
    ['/free-tools/broken-link-report', 'https://promptless.ai/free-tools/broken-link-report.md'],
    ['/docs/getting-started/welcome', 'https://promptless.ai/docs/getting-started/welcome.md'],
  ] as const;

  for (const [pathname, rewriteTarget] of cases) {
    const response = middleware(
      new Request(`https://promptless.ai${pathname}`, {
        headers: { accept: 'text/markdown, text/html' },
      })
    );

    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      rewriteTarget,
      `Expected ${pathname} to rewrite to ${rewriteTarget}.`
    );
  }
});

test('markdown middleware leaves normal html requests untouched', () => {
  const response = middleware(
    new Request('https://promptless.ai/pricing', {
      headers: { accept: 'text/html' },
    })
  );

  assert.equal(response.headers.get('x-middleware-rewrite'), null);
});

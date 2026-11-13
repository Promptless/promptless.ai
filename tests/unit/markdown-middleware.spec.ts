import assert from 'node:assert/strict';
import test from 'node:test';
import middleware from '../../middleware';

test('markdown middleware rewrites website routes to their markdown variants', () => {
  const cases = [
    ['/', 'https://promptless.ai/index.md'],
    ['/demo', 'https://promptless.ai/demo.md'],
    ['/pricing', 'https://promptless.ai/pricing.md'],
    ['/wall-of-love', 'https://promptless.ai/wall-of-love.md'],
    ['/free-tools', 'https://promptless.ai/free-tools.md'],
    ['/free-tools/broken-link-report', 'https://promptless.ai/free-tools/broken-link-report.md'],
    ['/agent-score', 'https://promptless.ai/agent-score.md'],
    ['/agent-score/docs.stripe.com', 'https://promptless.ai/agent-score/docs.stripe.com.md'],
    ['/agent-score/stripe.com/docs', 'https://promptless.ai/agent-score/stripe.com/docs.md'],
    ['/docs/for-docs/start-here/welcome', 'https://promptless.ai/docs/for-docs/start-here/welcome.md'],
    ['/docs/governance', 'https://promptless.ai/docs/governance.md'],
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

test('markdown middleware passes Agent Score markdown and OG image paths through', () => {
  for (const pathname of ['/agent-score/docs.stripe.com.md', '/agent-score/docs.stripe.com/og.png']) {
    const response = middleware(
      new Request(`https://promptless.ai${pathname}`, {
        headers: { accept: 'text/markdown' },
      })
    );
    assert.equal(response.headers.get('x-middleware-rewrite'), null, `Expected ${pathname} to pass through.`);
  }
});

test('markdown middleware matcher covers Agent Score routes', async () => {
  const { config } = await import('../../middleware');
  assert.ok(config.matcher.includes('/agent-score'));
  assert.ok(config.matcher.includes('/agent-score/:path*'));
});

test('markdown middleware leaves normal html requests untouched', () => {
  const response = middleware(
    new Request('https://promptless.ai/pricing', {
      headers: { accept: 'text/html' },
    })
  );

  assert.equal(response.headers.get('x-middleware-rewrite'), null);
});

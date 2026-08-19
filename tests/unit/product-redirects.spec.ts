import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixture = JSON.parse(
  readFileSync(path.join(repoRoot, 'tests/fixtures/pre-product-split-routes.json'), 'utf8')
) as {
  sourceCommit: string;
  forDocsHtml: string[];
  markdownAndOpenGraphExcluded: string[];
  utilityHtml: string[];
};
const redirectManifest = JSON.parse(
  readFileSync(path.join(repoRoot, 'src/lib/generated/redirects.json'), 'utf8')
) as { redirects: Array<{ source: string; destination: string; permanent: boolean }> };
const vercelConfig = JSON.parse(readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8')) as {
  redirects: Array<{ source: string; has?: unknown[] }>;
};

const redirectsBySource = new Map(
  redirectManifest.redirects.map((redirect) => [redirect.source, redirect])
);

test('frozen HTML, Markdown, and Open Graph routes have direct permanent redirects', () => {
  const excluded = new Set(fixture.markdownAndOpenGraphExcluded);

  for (const source of fixture.forDocsHtml) {
    const destination = `/docs/for-docs${source.slice('/docs'.length)}`;
    assert.deepEqual(redirectsBySource.get(source), { source, destination, permanent: true });

    if (excluded.has(source)) continue;
    const markdownSource = `${source}.md`;
    assert.deepEqual(redirectsBySource.get(markdownSource), {
      source: markdownSource,
      destination: `${destination}.md`,
      permanent: true,
    });

    const openGraphSource = `/og${source}.png`;
    assert.deepEqual(redirectsBySource.get(openGraphSource), {
      source: openGraphSource,
      destination: `/og/docs/for-docs${source.slice('/docs'.length)}.png`,
      permanent: true,
    });
  }
});

test('historical redirects terminate directly in the canonical product namespace', () => {
  const sources = new Set(redirectManifest.redirects.map(({ source }) => source));
  const chains = redirectManifest.redirects.filter(({ destination }) => sources.has(destination));
  assert.deepEqual(chains, []);

  for (const { destination } of redirectManifest.redirects) {
    if (destination.startsWith('/docs/') && !fixture.utilityHtml.includes(destination)) {
      assert.match(destination, /^\/docs\/for-docs\//);
    }
  }
});

test('Vercel retains only host-specific redirects', () => {
  assert.ok(vercelConfig.redirects.length > 0);
  for (const redirect of vercelConfig.redirects) {
    assert.ok(redirect.has?.length, `${redirect.source} should live in Astro, not vercel.json.`);
  }
});

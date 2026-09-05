import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractPage } from '../src/core/extract';
import { createIndex, loadIndex, search, readPage } from '../src/core/search';
import { buildCorpus } from '../src/core/build';
import { loadCorpus } from '../src/server/corpus';
import type { Page, SearchArtifact } from '../src/core/types';

const html = `<!doctype html><html lang="en"><head><title>Slack setup | Example</title></head><body>
<div data-starport-page><nav>Repeated navigation</nav><main data-pagefind-body><h1 id="_top">Slack setup</h1>
<p>Connect your workspace.</p><h2 id="actual-setup-anchor">Configure Slack</h2>
<p>Set <code>SLACK_BOT_TOKEN</code> then <a href="../api/#auth">authorize</a>.</p>
<pre><code><span>export </span><span>SLACK_BOT_TOKEN</span><span>=abc</span>\ncurl /api</code></pre>
<table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody><tr><td>scope</td><td>chat:write</td></tr></tbody></table>
<div>word one</div><div>word two</div><button>Copy</button><div id="dropdown-menu">Open in ChatGPT</div>
<div data-pagefind-ignore>Excluded controls</div><footer>Next page boilerplate</footer>
</main></div></body></html>`;

test('rendered extraction retains code, tables, links and actual anchors, without repeated controls', () => {
  const page = extractPage(html, '/docs/slack/')!;
  assert.equal(page.title, 'Slack setup');
  assert.equal(page.type, 'docs');
  const section = page.sections.find((s) => s.id === 'actual-setup-anchor')!;
  assert.match(section.markdown, /export SLACK_BOT_TOKEN=abc\ncurl \/api/);
  assert.match(section.markdown, /\| scope \| chat:write \|/);
  assert.match(section.markdown, /\[authorize\]\(\/docs\/api\/#auth\)/);
  assert.match(section.text, /word one word two/);
  assert.match(section.text, /SLACK_BOT_TOKEN=abc/);
  assert.doesNotMatch(JSON.stringify(page), /Repeated navigation|boilerplate|Excluded controls|Open in ChatGPT/);
});

test('excludes noindex, redirects, drafts, internal routes and per-page search exclusions', () => {
  for (const input of [
    html.replace('<head>', '<head><meta name="robots" content="noindex, follow">'),
    html.replace('<head>', '<head><meta http-equiv="refresh" content="0;url=/elsewhere">'),
    html.replace('data-starport-page', 'data-starport-page data-starport-exclude-page'),
    html.replace('main data-pagefind-body', 'main'),
    html.replace('main data-pagefind-body', 'main data-pagefind-body data-search-exclude'),
  ]) assert.equal(extractPage(input, '/docs/slack/'), null);
  assert.equal(extractPage(html, '/docs/internal/test/'), null);
  assert.equal(extractPage(html, '/private/child/', { exclude: ['/private/*'] }), null);
  assert.equal(extractPage(html, '/one/', { exclude: ['/one'] }), null);
  assert.ok(extractPage(html.replace('data-starport-page', ''), '/blog/post/'));
});

test('retains locale and custom API classification', () => {
  const page = extractPage(html.replace('lang="en"', 'lang="es"'), '/docs/api/operation/', { apiPaths: ['/docs/api'] })!;
  assert.equal(page.locale, 'es'); assert.equal(page.type, 'api');
});

test('exact identifiers, prefixes and ordinary transposed typos use MiniSearch ranking', () => {
  const page = extractPage(html, '/docs/slack/')!;
  const index = createIndex([page]);
  assert.equal(search(index, 'SLACK_BOT_TOKEN')[0].sectionId, 'actual-setup-anchor');
  assert.ok(search(index, 'slcak').length);
  assert.ok(search(index, 'conf').length);
  assert.equal(search(index, 'SLACK_NONEXISTENT_TOKEN').length, 0);
});

test('a strongly relevant blog can win the modest docs boost', () => {
  const docs = extractPage(html, '/docs/slack/')!;
  const blog = { ...docs, id: '/blog/penguins/', type: 'blog', title: 'Penguin migration', sections: [{ id: '', heading: 'Penguin migration', text: 'Penguins migrate.', markdown: 'Penguins migrate.' }] } satisfies Page;
  const index = createIndex([docs, blog]);
  assert.equal(search(index, 'penguin migration')[0].pageId, blog.id);
  assert.equal(search(index, 'slack', { locale: 'es' }).length, 0);
});

test('browser serialization and server search/read use the same rendered artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'starport-search-test-'));
  try {
    const out = join(dir, 'site'), artifacts = join(dir, 'artifacts');
    await mkdir(join(out, 'api', 'slack'), { recursive: true });
    await writeFile(join(out, 'api', 'slack', 'index.html'), html);
    await buildCorpus(out, artifacts, {});
    const serialized = JSON.parse(await readFile(join(artifacts, 'index.json'), 'utf8')) as SearchArtifact;
    const browserIndex = loadIndex(serialized);
    const corpus = await loadCorpus(artifacts);
    assert.deepEqual(search(browserIndex, 'SLACK_BOT_TOKEN'), corpus.search('SLACK_BOT_TOKEN'));
    assert.ok(corpus.readPage('/api/slack/', 'actual-setup-anchor')?.sections[0].markdown.includes('export SLACK_BOT_TOKEN'));
    assert.equal(corpus.readPage('/etc/passwd'), null);
    assert.equal(corpus.readPage('/api/slack/', 'invented-anchor'), null);
    assert.equal(corpus.pageId('/api/slack'), '/api/slack/');
    const manifest = JSON.parse(await readFile(join(out, 'starport-search', 'manifest.json'), 'utf8'));
    assert.deepEqual(JSON.parse(await readFile(join(out, 'starport-search', manifest.index), 'utf8')), serialized);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('missing server artifact fails explicitly', async () => {
  await assert.rejects(loadCorpus('/does-not-exist/starport-search'));
  assert.equal(readPage(new Map(), '/unknown'), null);
});

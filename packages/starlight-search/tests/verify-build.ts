import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import { documentsFor, loadIndex, search } from '../src/core/search';
import { loadCorpus } from '../src/server/corpus';
import type { ContentArtifact, SearchArtifact } from '../src/core/types';

const exists = async (path: string) => access(path).then(() => true, () => false);
const output = await exists('dist/starport-search/manifest.json') ? 'dist' : '.vercel/output/static';
const content = JSON.parse(await readFile('.starport/search/pages.json', 'utf8')) as ContentArtifact;
const serialized = JSON.parse(await readFile('.starport/search/index.json', 'utf8')) as SearchArtifact;
const index = loadIndex(serialized);
const corpus = await loadCorpus('.starport/search');
let anchors = 0;
for (const page of content.pages) {
  const path = join(output, decodeURI(page.id));
  const file = await exists(path + '.html') ? path + '.html' : join(path, 'index.html');
  const $ = load(await readFile(file, 'utf8'));
  assert.ok($('main').length, `${page.id} has main content`);
  for (const section of page.sections) {
    if (!section.id) continue;
    assert.ok($('[id]').toArray().some((element) => $(element).attr('id') === section.id), `${page.id}#${section.id} exists`);
    anchors++;
  }
  for (const query of [page.title, page.sections.find((section) => section.id)?.heading].filter(Boolean) as string[]) {
    assert.deepEqual(search(index, query), corpus.search(query), `browser/server parity: ${query}`);
  }
}
assert.equal(index.documentCount, documentsFor(content.pages).length);
const manifest = JSON.parse(await readFile(join(output, 'starport-search/manifest.json'), 'utf8'));
assert.deepEqual(JSON.parse(await readFile(join(output, 'starport-search', manifest.index), 'utf8')), serialized);
const functionDir = '.vercel/output/functions/_render.func';
if (output !== 'dist' && await exists(functionDir)) {
  const { routes } = JSON.parse(await readFile('.vercel/output/config.json', 'utf8')) as {
    routes: { src?: string; dest?: string; status?: number; headers?: Record<string, string> }[];
  };
  const assistantRoute = routes.findIndex((route) => route.dest && route.src?.includes('/_starport/assistant'));
  if (assistantRoute >= 0) {
    for (const route of routes.slice(0, assistantRoute)) {
      if (!route.src || !route.headers?.Location || !route.status || route.status < 300 || route.status >= 400) continue;
      assert.ok(!new RegExp(route.src).test('/_starport/assistant'), `Assistant is shadowed by redirect ${route.src}`);
    }
  }
  for (const file of ['index.json', 'pages.json']) {
    assert.equal(await readFile(join(functionDir, '.starport/search', file), 'utf8'), await readFile(join('.starport/search', file), 'utf8'));
  }
}
console.log(`Verified ${content.pages.length} rendered pages, ${anchors} actual anchors, browser/server parity, and matching public/server artifacts.`);

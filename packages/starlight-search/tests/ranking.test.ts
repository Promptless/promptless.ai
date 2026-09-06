import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPage } from '../src/core/extract';
import { createIndex, loadIndex, resolveRanking, search } from '../src/core/search';
import type { Page, SearchArtifact } from '../src/core/types';

function page(id: string, title: string, description: string, sections: [string, string][] = []): Page {
  return extractPage(`<html lang="en"><head><meta name="description" content="${description}"></head>
    <body><main><h1 id="_top">${title}</h1><p>Read this guide.</p>
    ${sections.map(([heading, text], i) => `<h2 id="section-${i}">${heading}</h2><p>${text}</p>`).join('')}
    </main></body></html>`, id)!;
}

test('description identifies the article; filenames cannot match disconnected words', () => {
  const reference = page('/docs/reference/', 'Configuration reference', 'Complete reference for the promptless.yaml configuration file');
  const incidental = page('/docs/schedule/', 'Schedule triggers', 'Run jobs on a schedule.', [['Configure in YAML', 'Edit promptless.yaml to schedule work.']]);
  const api = page('/api/', 'Promptless API', 'API overview.', [['Download', 'Download the OpenAPI spec (YAML).']]);
  assert.equal(reference.description, 'Complete reference for the promptless.yaml configuration file');
  const index = createIndex([reference, incidental, api]);
  for (const query of ['promptless.yaml', 'promptless.yam', 'promptles.yaml']) {
    const results = search(index, query);
    assert.equal(results[0].pageId, reference.id, query);
    assert.ok(!results.some((result) => result.pageId === api.id), query);
  }
  assert.ok(search(index, 'yaml').some((result) => result.pageId === reference.id), 'component words remain searchable');
});

test('page limit applies after grouping and specific section matches keep real links', () => {
  const manySections = page('/docs/large/', 'Long guide', '', Array.from({ length: 20 }, (_, i) => [i === 0 ? 'Needle' : `Other settings ${i}`, 'Exact needle settings.']));
  const small = page('/docs/small/', 'Small guide', 'Needle settings for a different product.');
  const results = search(createIndex([manySections, small]), 'needle', { limit: 2 });
  assert.equal(results.length, 2);
  assert.equal(new Set(results.map((result) => result.pageId)).size, 2);
  assert.ok(results.every((result) => result.url === result.pageId));
  const large = results.find((result) => result.pageId === manySections.id)!;
  assert.equal(large.sections.length, 1);
  assert.equal(large.sections[0].url, '/docs/large/#section-0');
});

test('article title and words across sections combine without copying title boosts into every section', () => {
  const guide = page('/docs/slack/', 'Slack', '', [['Credentials', 'Authorize access.'], ['Permissions', 'Use a token.']]);
  assert.equal(search(createIndex([guide]), 'Slack token')[0].pageId, guide.id);
  assert.equal(search(createIndex([guide]), 'authorize token')[0].pageId, guide.id);
});

test('page titles, descriptions and section headings can satisfy one multiword query', () => {
  const guide = page('/docs/slack/', 'Slack integration', 'Connect your workspace.', [['Credentials', 'Authorize access.'], ['Permissions', 'Request the following scopes.']]);
  const index = createIndex([guide]);
  const restored = loadIndex({ version: 2, index: index.engine.toJSON(), ranking: index.ranking } as SearchArtifact);
  for (const query of ['slack permissions', 'workspace permissions', 'credentials permissions']) {
    const results = search(index, query);
    assert.equal(results[0]?.pageId, guide.id, query);
    assert.deepEqual(search(restored, query), results, 'browser and server agree');
  }
  assert.deepEqual(search(createIndex([guide], { fields: { heading: 0 } }), 'slack permissions'), []);
});

test('field and content-type multipliers change ordering and support disabling fields', () => {
  const description = page('/docs/description/', 'A guide', 'Needle');
  const heading = page('/docs/heading/', 'Another guide', '', [['Needle', 'Ordinary body.']]);
  const fieldRanking = { fields: { description: 20, heading: 1 } };
  assert.equal(search(createIndex([description, heading], fieldRanking), 'needle')[0].pageId, description.id);
  assert.equal(search(createIndex([description, heading], { fields: { description: 1, heading: 20 } }), 'needle')[0].pageId, heading.id);
  assert.deepEqual(search(createIndex([description], { fields: { description: 0 } }), 'needle'), []);
  const blog = { ...description, id: '/blog/guide/', type: 'blog' as const };
  assert.equal(search(createIndex([description, blog], { contentTypes: { blog: 3 } }), 'needle')[0].pageId, blog.id);
  assert.ok(search(createIndex([description, blog], { contentTypes: { blog: 0 } }), 'needle').every((result) => result.type !== 'blog'));
});

test('defaults, invalid configuration and obsolete artifacts fail predictably', () => {
  assert.deepEqual(resolveRanking().fields, { title: 4, description: 3, heading: 2, body: 1 });
  for (const invalid of [-1, NaN, Infinity]) assert.throws(() => resolveRanking({ fields: { description: invalid } }), /finite, non-negative/);
  assert.throws(() => loadIndex({ version: 1 } as unknown as SearchArtifact), /Rebuild the site/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus } from '../packages/starlight-search/src/server/corpus';

// Visitor tasks against the production build, not a synthetic ranking fixture.
const corpus = await loadCorpus('.starport/search');
const tasks = [
  { query: 'promptless.yaml', path: '/docs/for-docs/reference/configuration-reference/', within: 1 },
  { query: 'promptles.yaml', path: '/docs/for-docs/reference/configuration-reference/', within: 1 },
  { query: 'slack setup', path: '/docs/for-docs/connect/triggers/slack-messages/', within: 3 },
  { query: 'slcak', path: '/docs/for-docs/reference/integrations/slack/', within: 3 },
  { query: 'slack_listen', path: '/docs/for-docs/connect/triggers/slack-messages/', within: 3 },
  { query: 'INSTRUCTION_HUB_ANALYSIS_MODEL_NAME', path: '/docs/governance/deploy-the-worker/configuration-reference/', within: 1 },
  { query: 'API authentication', path: '/docs/for-docs/connect/triggers/api/', within: 3 },
  { query: 'submit API trigger', path: '/docs/for-docs/api/operations/submitapitrigger/', within: 1 },
  { query: 'install plugin', path: '/docs/governance/get-started/publish-and-install-plugins/', within: 3 },
  { query: 'agent instructions', path: '/docs/governance/', within: 3 },
  { query: 'pricing', path: '/pricing/', within: 1 },
];

for (const { query, path, within } of tasks) {
  test(`visitor search: ${query}`, () => {
    const results = corpus.search(query, { locale: 'en' });
    assert.ok(results.slice(0, within).some((result) => result.pageId === path), `${path} should appear in the top ${within}: ${results.map((result) => result.pageId).join(', ')}`);
    assert.equal(new Set(results.map((result) => result.pageId)).size, results.length);
    for (const result of results) {
      assert.ok(corpus.readPage(result.pageId));
      for (const section of result.sections) assert.ok(corpus.readPage(result.pageId, section.sectionId));
    }
  });
}

test('visitor search: undocumented Snowflake connector', () => {
  assert.deepEqual(corpus.search('snowflake connector', { locale: 'en' }), []);
});

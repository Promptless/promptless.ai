import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeTargetUrl, parseSlug } from '../../src/lib/agent-score/slug';
import { CATEGORIES, TOTAL_CHECKS, gradeForScore } from '../../src/lib/agent-score/meta';
import { actionableChecks, buildFixPrompt, buildMarkdownReport, summarySentence } from '../../src/lib/agent-score/report';
import { affectedPages, checkIssues, diagnosticIssues, fixText, shortUrl } from '../../src/lib/agent-score/issues';
import { looksLikeSinglePage, partialScan } from '../../src/lib/agent-score/discovery';
import type { ScanResult, SiteResponse } from '../../src/lib/agent-score/types';

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../src/lib/agent-score/fixtures/${name}.json`, import.meta.url), 'utf8')) as SiteResponse;

test('parseSlug canonicalizes hosts and keeps path case', () => {
  assert.deepEqual(parseSlug('Docs.Stripe.com/'), { ok: true, slug: 'docs.stripe.com', host: 'docs.stripe.com', segments: [] });
  const withPath = parseSlug('stripe.com/Docs/API');
  assert.ok(withPath.ok);
  assert.equal(withPath.slug, 'stripe.com/Docs/API');
  const deepPath = parseSlug('example.com/products/x/docs/latest/guide');
  assert.ok(deepPath.ok, 'Expected a 5-segment path to be accepted.');
  assert.equal(deepPath.slug, 'example.com/products/x/docs/latest/guide');
  const deeperPath = parseSlug('example.com/a/b/c/d/e/f');
  assert.ok(deeperPath.ok);
  assert.equal(deeperPath.slug, 'example.com/a/b/c/d/e/f');
});

test('parseSlug rejects non-public and malformed hosts', () => {
  for (const raw of ['localhost', '10.0.0.1', 'intranet.local', 'a_b.com', 'example.com/../etc', '']) {
    assert.equal(parseSlug(raw).ok, false, `Expected ${raw} to be rejected.`);
  }
});

test('normalizeTargetUrl accepts bare hosts and strips query and fragment', () => {
  const cases: Array<[string, string, string]> = [
    ['docs.stripe.com', 'docs.stripe.com', 'https://docs.stripe.com'],
    ['https://Stripe.com/docs/?utm=1#top', 'stripe.com/docs', 'https://stripe.com/docs'],
    ['http://docs.example.com/guide/', 'docs.example.com/guide', 'http://docs.example.com/guide'],
    ['https://example.com/a/b/c/d/e/f', 'example.com/a/b/c/d/e/f', 'https://example.com/a/b/c/d/e/f'],
  ];
  for (const [input, slug, url] of cases) {
    const result = normalizeTargetUrl(input);
    assert.ok(result.ok, `Expected ${input} to normalize.`);
    assert.deepEqual(result.value, { slug, url });
  }
  for (const input of ['ftp://docs.example.com', 'https://user:pw@docs.example.com', 'not a url']) {
    const result = normalizeTargetUrl(input);
    assert.ok(!result.ok, `Expected ${input} to be rejected.`);
    assert.equal(result.code, 'invalid');
  }
});

test('normalizeTargetUrl rejects every explicit port with the custom_port code', () => {
  for (const input of ['https://docs.example.com:8443', 'https://docs.example.com:443', 'http://docs.example.com:80/guide', 'docs.example.com:', 'https://[2606:4700::1]:443']) {
    const result = normalizeTargetUrl(input);
    assert.ok(!result.ok, `Expected ${input} to be rejected.`);
    assert.equal(result.code, 'custom_port', `Expected ${input} to be rejected as a custom port.`);
  }
  const bracketed = normalizeTargetUrl('https://[2606:4700::1]/docs');
  assert.ok(!bracketed.ok);
  assert.equal(bracketed.code, 'invalid', 'an IPv6 literal without a port is rejected as a bad host, not as a port');
});

test('category metadata scores 27 of the 28 afdocs checks', () => {
  assert.equal(CATEGORIES.length, 7);
  assert.equal(TOTAL_CHECKS, 27);
  assert.equal(gradeForScore(100), 'A+');
  assert.equal(gradeForScore(86), 'B');
  assert.equal(gradeForScore(59), 'F');
});

test('fixtures match the contract shape the pages render', () => {
  for (const [name, slug] of [['promptless.ai-docs', 'promptless.ai/docs'], ['docs.acme-api.dev', 'docs.acme-api.dev'], ['developer.deel.com', 'developer.deel.com']]) {
    const site = fixture(name);
    assert.equal(site.slug, slug);
    assert.equal(site.latest.categories.map((c) => c.id).join(), CATEGORIES.map((c) => c.id).join());
    const checks = site.latest.categories.flatMap((c) => c.checks);
    assert.equal(checks.length, site.latest.summary.total);
    assert.ok(site.history.length >= 1);
    assert.equal(site.history[0].scanId, site.latest.scanId, 'history is newest-first');
  }
});

test('summary sentence and fix prompt describe the scan', () => {
  const site = fixture('docs.acme-api.dev');
  assert.match(summarySentence(site.displayName, site.latest), /^docs\.acme-api\.dev scores \d+\/100 \(Grade [A-F+]+\), passing 10 of 28 checks; 5 fail, 5 warn, 8 skipped\.$/);

  const prompt = buildFixPrompt(site, 'https://promptless.ai/agent-score/docs.acme-api.dev');
  assert.match(prompt, /^# Agent Score fix report: docs\.acme-api\.dev/);
  assert.match(prompt, /## Failing checks/);
  assert.match(prompt, /## Warnings/);
  assert.ok(prompt.trimEnd().endsWith('npx afdocs@latest check https://docs.acme-api.dev --skip-checks llms-txt-coverage --fixes --verbose\n```'));

  const ordered = actionableChecks(site.latest).map((item) => item.gain);
  assert.deepEqual(ordered, [...ordered].sort((a, b) => b - a), 'fixes are ordered by potential gain');
});

test('markdown report includes history, changes, and every check', () => {
  const site = fixture('promptless.ai-docs');
  const md = buildMarkdownReport(site, {
    pageUrl: 'https://promptless.ai/agent-score/promptless.ai/docs',
    jsonUrl: 'https://api.gopromptless.ai/public/free-tools/agent-score/sites/promptless.ai/docs',
    badgeUrl: 'https://api.gopromptless.ai/public/free-tools/agent-score/sites/promptless.ai/docs/badge.svg',
  });
  assert.match(md, /^# Agent Score: promptless\.ai\/docs/);
  assert.match(md, /\[llms\.txt\]\(\/llms\.txt\)/);
  assert.match(md, /## Score history/);
  assert.match(md, /## What changed since the last scan/);
  for (const check of site.latest.categories.flatMap((c) => c.checks)) {
    assert.ok(md.includes(`\`${check.id}\``), `Expected ${check.id} in the markdown report.`);
  }
});

test('issues list affected pages and drop the result restated in the fix', () => {
  const { latest } = fixture('developer.deel.com');
  const checks = new Map(latest.categories.flatMap((c) => c.checks).map((check) => [check.id, check]));

  const size = affectedPages(checks.get('page-size-markdown')!);
  assert.equal(size.total, 2);
  assert.deepEqual(size.pages[0], { url: 'https://developer.deel.com/api/deel-it/endpoints/it-assets/unarchive-asset-v-2026-09-17', note: '130K chars' });
  assert.equal(affectedPages(checks.get('markdown-link-portability')!).total, 42, 'totals come from the afdocs buckets, not the trimmed rows');
  assert.deepEqual(
    affectedPages(checks.get('llms-txt-links-resolve')!).pages.map((page) => page.note),
    ['HTTP 404', 'HTTP 404', 'HTTP 403'],
  );

  assert.equal(fixText(checks.get('page-size-markdown')!), 'Break these into smaller pages or restructure serialized tabbed content.');
  const llms = checks.get('llms-txt-exists')!;
  assert.equal(fixText({ ...llms, resolution: 'Serve llms.txt from the docs host.' }), 'Serve llms.txt from the docs host.', 'fixes that do not restate a count stay whole');

  const issues = checkIssues(latest);
  assert.deepEqual([...issues.keys()].sort(), ['llms-txt-links-resolve', 'markdown-content-parity', 'markdown-link-portability', 'page-size-markdown', 'page-size-transfer']);

  const [diagnostic] = diagnosticIssues(latest);
  assert.equal(diagnostic.title, 'Markdown versions drop content on generated pages');
  assert.equal(diagnostic.pageTotal, 4);
  assert.equal(diagnostic.pages.length, 3);
  assert.match(diagnostic.summary, /^The markdown variant is a second rendering pipeline/);

  assert.equal(shortUrl('https://developer.deel.com/api/x', 'developer.deel.com'), '/api/x');
  assert.equal(shortUrl('https://api.letsdeel.com/mcp', 'developer.deel.com'), 'api.letsdeel.com/mcp');
});

/** The acme fixture's latest scan, re-pointed at `slug` with afdocs results for a thin scan. */
function thinScan(slug: string, options: { testedPages: number; sources: string[]; llmsTxt: string | null }): ScanResult {
  const latest = structuredClone(fixture('docs.acme-api.dev').latest);
  latest.slug = slug;
  latest.testedPages = options.testedPages;
  latest.discoverySources = options.sources;
  for (const category of latest.categories) {
    for (const check of category.checks) {
      if (check.id === 'llms-txt-exists') check.evidence = options.llmsTxt ? { canonicalUrl: options.llmsTxt } : null;
    }
  }
  return latest;
}

test('partialScan suggests the folder of an llms.txt above the scanned path', () => {
  const latest = thinScan('developer.globalpayments.com/docs/getting-started/overview', {
    testedPages: 1,
    sources: ['llms-txt'],
    llmsTxt: 'https://developer.globalpayments.com/llms.txt',
  });
  assert.deepEqual(partialScan(latest), {
    kind: 'index_above',
    testedPages: 1,
    indexUrl: 'https://developer.globalpayments.com/llms.txt',
    suggestion: 'developer.globalpayments.com',
  });
  const nested = thinScan('example.com/docs/guides/start', { testedPages: 2, sources: ['llms-txt'], llmsTxt: 'https://example.com/docs/llms.txt' });
  assert.equal((partialScan(nested) as { suggestion: string }).suggestion, 'example.com/docs');
});

test('partialScan suggests the host root for a deep URL with no llms.txt above it', () => {
  const sameFolder = thinScan('example.com/docs', { testedPages: 3, sources: ['llms-txt'], llmsTxt: 'https://example.com/docs/llms.txt' });
  assert.deepEqual(partialScan(sameFolder), { kind: 'deep_url', testedPages: 3, suggestion: 'example.com' });
  const otherHost = thinScan('docs.example.com/guide', { testedPages: 1, sources: ['fallback'], llmsTxt: 'https://example.com/llms.txt' });
  assert.deepEqual(partialScan(otherHost), { kind: 'deep_url', testedPages: 1, suggestion: 'docs.example.com' });
});

test('partialScan separates a root with no index from a root with a thin index', () => {
  assert.deepEqual(partialScan(thinScan('docs.example.com', { testedPages: 1, sources: ['fallback'], llmsTxt: null })), {
    kind: 'no_index',
    testedPages: 1,
  });
  assert.deepEqual(
    partialScan(thinScan('docs.example.com', { testedPages: 4, sources: ['llms-txt'], llmsTxt: 'https://docs.example.com/llms.txt' })),
    { kind: 'few_pages', testedPages: 4 },
  );
});

test('partialScan ignores scans that tested enough pages or did not report a count', () => {
  assert.equal(partialScan(thinScan('docs.example.com/a/b', { testedPages: 5, sources: ['fallback'], llmsTxt: null })), null);
  const unknown = thinScan('docs.example.com/a/b', { testedPages: 1, sources: ['fallback'], llmsTxt: null });
  delete unknown.testedPages;
  assert.equal(partialScan(unknown), null);
});

test('looksLikeSinglePage flags deep paths and page files, not docs roots', () => {
  for (const input of ['developer.globalpayments.com/docs/getting-started/overview', 'https://help.example.com/2026b/home.htm', 'example.com/guide.html']) {
    assert.equal(looksLikeSinglePage(input), true, `Expected ${input} to look like one page.`);
  }
  for (const input of ['docs.stripe.com', 'stripe.com/docs', 'airtable.com/developers/agents', 'not a url', '']) {
    assert.equal(looksLikeSinglePage(input), false, `Expected ${input} to look like a docs root.`);
  }
});

test('diagnosticIssues leaves the single-page diagnostic to the partial scan notice', () => {
  const latest = structuredClone(fixture('docs.acme-api.dev').latest);
  latest.diagnostics.push({ id: 'single-page-sample', severity: 'warning', message: 'Only 1 page was discovered and tested.', resolution: '' });
  assert.deepEqual(
    diagnosticIssues(latest).map((issue) => issue.key),
    fixture('docs.acme-api.dev').latest.diagnostics.map((diagnostic) => diagnostic.id),
  );
});

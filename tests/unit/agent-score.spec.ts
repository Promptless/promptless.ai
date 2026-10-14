import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeTargetUrl, parseSlug } from '../../src/lib/agent-score/slug';
import { CATEGORIES, TOTAL_CHECKS, gradeForScore } from '../../src/lib/agent-score/meta';
import { actionableChecks, buildFixPrompt, buildMarkdownReport, summarySentence } from '../../src/lib/agent-score/report';
import type { SiteResponse } from '../../src/lib/agent-score/types';

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../src/lib/agent-score/fixtures/${name}.json`, import.meta.url), 'utf8')) as SiteResponse;

test('parseSlug canonicalizes hosts and keeps path case', () => {
  assert.deepEqual(parseSlug('Docs.Stripe.com/'), { ok: true, slug: 'docs.stripe.com', host: 'docs.stripe.com', segments: [] });
  const withPath = parseSlug('stripe.com/Docs/API');
  assert.ok(withPath.ok);
  assert.equal(withPath.slug, 'stripe.com/Docs/API');
});

test('parseSlug rejects non-public and malformed hosts', () => {
  for (const raw of ['localhost', '10.0.0.1', 'intranet.local', 'a_b.com', 'example.com/a/b/c/d/e', 'example.com/../etc', '']) {
    assert.equal(parseSlug(raw).ok, false, `Expected ${raw} to be rejected.`);
  }
});

test('normalizeTargetUrl accepts bare hosts and strips query, fragment, and default ports', () => {
  const cases: Array<[string, string, string]> = [
    ['docs.stripe.com', 'docs.stripe.com', 'https://docs.stripe.com'],
    ['https://Stripe.com/docs/?utm=1#top', 'stripe.com/docs', 'https://stripe.com/docs'],
    ['http://docs.example.com:80/guide/', 'docs.example.com/guide', 'http://docs.example.com/guide'],
  ];
  for (const [input, slug, url] of cases) {
    const result = normalizeTargetUrl(input);
    assert.ok(result.ok, `Expected ${input} to normalize.`);
    assert.deepEqual(result.value, { slug, url });
  }
  for (const input of ['ftp://docs.example.com', 'https://user:pw@docs.example.com', 'https://docs.example.com:8443', 'not a url']) {
    assert.equal(normalizeTargetUrl(input).ok, false, `Expected ${input} to be rejected.`);
  }
});

test('category metadata covers the 28 afdocs checks', () => {
  assert.equal(CATEGORIES.length, 7);
  assert.equal(TOTAL_CHECKS, 28);
  assert.equal(gradeForScore(100), 'A+');
  assert.equal(gradeForScore(86), 'B');
  assert.equal(gradeForScore(59), 'F');
});

test('fixtures match the contract shape the pages render', () => {
  for (const [name, slug] of [['promptless.ai-docs', 'promptless.ai/docs'], ['docs.acme-api.dev', 'docs.acme-api.dev']]) {
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
  assert.ok(prompt.trimEnd().endsWith('npx afdocs@latest check https://docs.acme-api.dev --fixes --verbose\n```'));

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

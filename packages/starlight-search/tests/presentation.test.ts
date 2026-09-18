import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRanges } from '../src/core/matches';
import { excerpt } from '../src/core/excerpt';
import { fallbackBreadcrumbs } from '../src/core/breadcrumbs';
import { starterLinks } from '../src/core/shortcuts';
import { recentDestinations, rememberDestination } from '../src/client/destinations';

const highlighted = (text: string, terms: string[]) => matchRanges(text, terms).map(({ start, end }) => text.slice(start, end));

test('highlights whole indexed matches without lighting up contraction fragments or identifier substrings', () => {
  assert.deepEqual(highlighted("What's new? Versions, suggestions, Docs and PRs.", ['s']), []);
  assert.deepEqual(highlighted('promptless.yaml and slack_listen', ['promptless.yaml', 'listen']), ['promptless.yaml']);
  assert.deepEqual(highlighted('sub-component and promptless.yaml', ['component', 'yaml']), ['component', 'yaml']);
  assert.deepEqual(highlighted('Guía de configuración y API', ['guía', 'configuración', 'api']), ['Guía', 'configuración', 'API']);
  assert.deepEqual(highlighted('Use C or C++ but not Config', ['c']), ['C', 'C']);
  assert.deepEqual(highlighted('Components', ['components']), ['Components'], 'MiniSearch expands prefixes to actual indexed terms');
});

test('excerpt centers on a meaningful match and starts on a word boundary', () => {
  const text = 'Some suggestions. '.repeat(20) + 'Configure promptless.yaml to get started.';
  const value = excerpt(text, ['s', 'promptless.yaml']);
  assert.ok(value.includes('promptless.yaml'));
  assert.match(value, /^…(?:Some|suggestions)/);
});

test('fallback breadcrumbs use readable labels and collapse repeated changelog directories', () => {
  assert.deepEqual(fallbackBreadcrumbs('/changelog/changelogs/june-2026/', 'en'), ['Changelog']);
  assert.deepEqual(fallbackBreadcrumbs('/blog/product-updates/new/', 'en'), ['Blog', 'Product updates']);
  assert.deepEqual(fallbackBreadcrumbs('/es/api/reference/', 'es'), ['API']);
});

test('starter links support base paths and reject external or malformed destinations', () => {
  assert.equal(starterLinks({ en: [{ title: 'Guide', url: '/guide/' }] }, '/docs/').en[0].url, '/docs/guide/');
  for (const url of ['https://example.com', '//example.com', '/\\example.com', '/bad\npath', 'javascript:alert(1)']) {
    assert.throws(() => starterLinks({ en: [{ title: 'Unsafe', url }] }), /same-site/);
  }
  assert.throws(() => starterLinks({ en: Array(5).fill({ title: 'Guide', url: '/guide/' }) }), /four/);
});

test('recent destinations are tab-local, deduplicated, bounded and recover from malformed storage', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } });
  try {
    assert.deepEqual(recentDestinations(), []);
    for (let i = 0; i < 15; i++) rememberDestination({ title: `Page ${i}`, url: `/page-${i}/` }, 'en');
    rememberDestination({ title: 'Página', url: '/es/page/' }, 'es');
    rememberDestination({ title: 'Page 10', url: '/page-10/' }, 'en');
    const recent = recentDestinations();
    assert.equal(recent.length, 12);
    assert.equal(recent[0].url, '/page-10/');
    assert.equal(recent.filter((entry) => entry.url === '/page-10/').length, 1);
    assert.equal(recent[1].locale, 'es');
    const key = [...data.keys()][0];
    data.set(key, JSON.stringify([{ title: 'Unsafe', url: '//example.com', locale: 'en' }, null]));
    assert.deepEqual(recentDestinations(), []);
    data.set(key, '{broken');
    assert.deepEqual(recentDestinations(), []);
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.deepEqual(recentDestinations(), []);
    assert.equal(rememberDestination({ title: 'Guide', url: '/guide/' }, 'en')[0].url, '/guide/');
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

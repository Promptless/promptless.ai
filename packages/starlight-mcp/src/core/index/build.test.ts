/**
 * Tests for the build-time index generator, focused on slug/route derivation
 * matching Astro's real rules (github-slugger). Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildDocsIndex, type LocaleDef } from './build';

const ROOT_ONLY: LocaleDef[] = [{ key: 'root', lang: 'en', isRoot: true }];

function withDocs(files: Record<string, string>, fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-idx-'));
  try {
    for (const [rel, body] of Object.entries(files)) {
      const full = join(dir, rel);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, body);
    }
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const page = (title: string) => `---\ntitle: ${title}\n---\n\nBody for ${title}.\n`;

test('slugifies punctuated filenames exactly like Astro (github-slugger)', () => {
  withDocs(
    {
      'guides/v1.2 Release.md': page('Release'),
      'guides/C++ Guide.md': page('Cpp'),
      'guides/a--b.md': page('Dashes'),
      'index.mdx': page('Home'),
    },
    (dir) => {
      const paths = buildDocsIndex({ docsDir: dir, site: 'https://x/', base: '/', locales: ROOT_ONLY })
        .map((e) => e.path)
        .sort();
      // These are the routes Astro actually generates for these filenames.
      assert.ok(paths.includes('/guides/v12-release/'), `paths: ${paths.join(', ')}`);
      assert.ok(paths.includes('/guides/c-guide/'), `paths: ${paths.join(', ')}`);
      assert.ok(paths.includes('/guides/a--b/'), `paths: ${paths.join(', ')}`);
      assert.ok(paths.includes('/'), `paths: ${paths.join(', ')}`);
    },
  );
});

test('locale prefix + absolute URL derivation', () => {
  withDocs(
    { 'es/getting-started/welcome.md': page('Bienvenida') },
    (dir) => {
      const entries = buildDocsIndex({
        docsDir: dir,
        site: 'https://docs.example.com/',
        base: '/',
        locales: [
          { key: 'root', lang: 'en', isRoot: true },
          { key: 'es', lang: 'es', isRoot: false },
        ],
      });
      assert.equal(entries.length, 1);
      assert.equal(entries[0].path, '/es/getting-started/welcome/');
      assert.equal(entries[0].lang, 'es');
      assert.equal(entries[0].url, 'https://docs.example.com/es/getting-started/welcome/');
    },
  );
});

test('frontmatter slug overrides the file-derived route verbatim', () => {
  withDocs(
    {
      // Slug puts the page somewhere unrelated to its file location, like
      // promptless.ai's docs do (e.g. internal/component-fixtures.mdx →
      // slug: docs/internal/component-fixtures).
      'internal/component-fixtures.md': `---\ntitle: Fixtures\nslug: docs/internal/component-fixtures\n---\n\nx\n`,
      'guides/nested/page.md': `---\ntitle: Welcome\nslug: docs/start-here/welcome\n---\n\nx\n`,
      'home.md': `---\ntitle: Home\nslug: ""\n---\n\nx\n`,
    },
    (dir) => {
      const entries = buildDocsIndex({ docsDir: dir, site: 'https://x/', base: '/', locales: ROOT_ONLY });
      const paths = entries.map((e) => e.path).sort();
      assert.deepEqual(paths, ['/', '/docs/internal/component-fixtures/', '/docs/start-here/welcome/']);
      const welcome = entries.find((e) => e.title === 'Welcome');
      assert.equal(welcome?.url, 'https://x/docs/start-here/welcome/');
    },
  );
});

test('slug override with a locale prefix sets the entry language', () => {
  withDocs(
    { 'anywhere/guia.md': `---\ntitle: Guía\nslug: es/guia\n---\n\nx\n` },
    (dir) => {
      const entries = buildDocsIndex({
        docsDir: dir,
        site: 'https://x/',
        base: '/',
        locales: [
          { key: 'root', lang: 'en', isRoot: true },
          { key: 'es', lang: 'es', isRoot: false },
        ],
      });
      assert.equal(entries[0].path, '/es/guia/');
      assert.equal(entries[0].lang, 'es');
    },
  );
});

test('get_page markdown drops leading MDX imports and avoids a duplicate H1', () => {
  withDocs(
    {
      'with-imports.md': `---\ntitle: Fixtures\n---\n\nimport { Aside } from '@astrojs/starlight/components';\nimport Video from '@components/Video.astro';\n\n# Fixtures\n\nBody text.\n`,
      'plain.md': `---\ntitle: Plain\n---\n\nJust a body, no heading.\n\n\`\`\`js\nimport notStripped from 'inside-a-fence';\n\`\`\`\n`,
    },
    (dir) => {
      const entries = buildDocsIndex({ docsDir: dir, site: 'https://x/', base: '/', locales: ROOT_ONLY });
      const fixtures = entries.find((e) => e.title === 'Fixtures');
      // Imports stripped, and the body's own H1 is kept without prepending another.
      assert.equal(fixtures?.markdown, '# Fixtures\n\nBody text.\n');
      const plain = entries.find((e) => e.title === 'Plain');
      // Title prepended when the body has no H1; fenced `import` lines untouched.
      assert.match(plain?.markdown ?? '', /^# Plain\n\nJust a body, no heading\./);
      assert.match(plain?.markdown ?? '', /import notStripped from 'inside-a-fence';/);
    },
  );
});

test('draft pages are excluded', () => {
  withDocs(
    { 'guides/draft.md': `---\ntitle: Draft\ndraft: true\n---\n\nx\n`, 'guides/live.md': page('Live') },
    (dir) => {
      const paths = buildDocsIndex({ docsDir: dir, site: 'https://x/', base: '/', locales: ROOT_ONLY }).map(
        (e) => e.path,
      );
      assert.deepEqual(paths, ['/guides/live/']);
    },
  );
});

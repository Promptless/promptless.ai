import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inlineMdxPartials } from '../../src/lib/mdx-partials';

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'mdx-partials-'));
  mkdirSync(path.join(root, 'src', 'partials', 'integrations'), { recursive: true });
  mkdirSync(path.join(root, 'src', 'content', 'docs'), { recursive: true });
  writeFileSync(
    path.join(root, 'src', 'partials', 'integrations', 'connect.mdx'),
    "{/* Host page supplies the heading. */}\n\nimport { Steps } from '@astrojs/starlight/components';\nimport Note from '@partials/note.mdx';\n\n<Steps>\n1. Open **Integrations**.\n2. Select **Connect**.\n</Steps>\n\n<Note />\n",
  );
  writeFileSync(path.join(root, 'src', 'partials', 'note.mdx'), '---\ntitle: ignored\n---\n\nThe token needs the `api` scope.\n');
  return { root, page: path.join(root, 'src', 'content', 'docs', 'page.mdx') };
}

test('replaces a partial tag with its body, minus comments, imports, and frontmatter', () => {
  const { root, page } = fixture();
  const body = "import Connect from '@partials/integrations/connect.mdx';\n\n## Connect\n\n<Connect />\n\n## Next\n";
  const out = inlineMdxPartials(body, { fromFile: page, root });
  assert.ok(!out.includes('<Connect'));
  assert.ok(!out.includes('import '));
  assert.ok(!out.includes('Host page supplies'));
  assert.match(out, /## Connect\n\n<Steps>\n1\. Open \*\*Integrations\*\*\./);
  assert.match(out, /The token needs the `api` scope\.\n\n## Next/);
  assert.ok(!out.includes('title: ignored'));
});

test('indents an inlined partial to match its tag and leaves code fences alone', () => {
  const { root, page } = fixture();
  const body = "import Note from '../../partials/note.mdx';\n\n1. Step one.\n\n   <Note />\n\n```mdx\n<Note />\n```\n";
  const out = inlineMdxPartials(body, { fromFile: page, root });
  assert.match(out, /1\. Step one\.\n\n {3}The token needs the `api` scope\./);
  assert.match(out, /```mdx\n<Note \/>\n```/);
});

test('leaves the body unchanged when it imports no partials or a partial is missing', () => {
  const { root, page } = fixture();
  const plain = "import { Aside } from '@astrojs/starlight/components';\n\n<Aside>Hi</Aside>\n";
  assert.equal(inlineMdxPartials(plain, { fromFile: page, root }), plain);
  const missing = "import Gone from '@partials/gone.mdx';\n\n<Gone />\n";
  assert.equal(inlineMdxPartials(missing, { fromFile: page, root }), missing);
});

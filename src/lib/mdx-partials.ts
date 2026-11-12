import { readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Inline MDX partials into a page's raw source.
 *
 * Shared procedures live as MDX partials under `src/partials/` and pages embed
 * them the standard Astro/Starlight way: `import X from '@partials/x.mdx'`,
 * then `<X />`. The rendered site resolves those imports, but the raw-source
 * readers (the `/<page>.md` endpoint and the MCP `get_page` index) do not, so
 * an embedded procedure would vanish from agent-readable output. This replaces
 * each self-closing `<X />` tag with the partial's body (frontmatter and import
 * lines removed, nested partials inlined), indented to match the tag.
 *
 * Only single-line default imports of `.md`/`.mdx` files are inlined. Tags in
 * fenced code blocks are left alone.
 */

export interface InlineOptions {
  /** Absolute path of the file whose body is being inlined. */
  fromFile: string;
  /** Project root, used to resolve `@partials/` and `/src/...` specifiers. */
  root: string;
}

const IMPORT_RE = /^import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+['"]([^'"]+\.mdx?)['"];?\s*$/;
const ANY_IMPORT_RE = /^import\s.+['"];?\s*$/;
const MAX_DEPTH = 5;

function resolveSpecifier(spec: string, fromFile: string, root: string): string {
  if (spec.startsWith('@partials/')) return path.join(root, 'src', 'partials', spec.slice('@partials/'.length));
  if (spec.startsWith('/')) return path.join(root, spec);
  return path.resolve(path.dirname(fromFile), spec);
}

function inline(body: string, options: InlineOptions, depth: number): string {
  const lines = body.split('\n');
  const partials = new Map<string, string>();
  for (const line of lines) {
    const match = line.match(IMPORT_RE);
    if (!match) continue;
    const [, name, spec] = match;
    const file = resolveSpecifier(spec, options.fromFile, options.root);
    let content: string;
    try {
      content = matter(readFileSync(file, 'utf8')).content;
    } catch {
      continue;
    }
    const nested = depth < MAX_DEPTH ? inline(content, { ...options, fromFile: file }, depth + 1) : content;
    const withoutImports = nested
      .replace(/\{\/\*[\s\S]*?\*\/\}\s*/g, '')
      .split('\n')
      .filter((partialLine) => !ANY_IMPORT_RE.test(partialLine))
      .join('\n')
      .trim();
    partials.set(name, withoutImports);
  }
  if (partials.size === 0) return body;

  const out: string[] = [];
  let fence: string | null = null;
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      out.push(line);
      if (fenceMatch && line.trim() === fenceMatch[1] && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }
    const importMatch = line.match(IMPORT_RE);
    if (importMatch && partials.has(importMatch[1])) continue;
    const tag = line.match(/^(\s*)<([A-Z][A-Za-z0-9_]*)\b[^>]*\/>\s*$/);
    if (tag && partials.has(tag[2])) {
      const indent = tag[1];
      out.push(...partials.get(tag[2])!.split('\n').map((partialLine) => (partialLine ? indent + partialLine : partialLine)));
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

export function inlineMdxPartials(body: string, options: InlineOptions): string {
  return inline(body, options, 0);
}

#!/usr/bin/env node
// AST-based inventory using gray-matter + remark + remark-mdx.
// Re-validates the regex-based build-inventory.py counts.
// Outputs: evidence/inventory-ast.json + a console summary comparing to inventory.json.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

const REPO = resolve(import.meta.dirname, '../../../..'); // evidence -> 2026-05-18 -> audits -> meta -> promptless.ai
const DOCS_ROOT = join(REPO, 'src/content/docs');

function walkMdx(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'internal') continue;
      out.push(...walkMdx(p));
    } else if (name.endsWith('.mdx')) {
      out.push(p);
    }
  }
  return out;
}

function gitMeta(rel) {
  try {
    const last = execSync(`git log -1 --format=%H|%ci|%an|%ae -- "${rel}"`, { cwd: REPO, encoding: 'utf8' }).trim();
    if (!last) return {};
    const [sha, when, author, email] = last.split('|', 4);
    return { last_sha: sha, last_modified: when, last_author: author, last_author_email: email };
  } catch {
    return {};
  }
}

function analyzeAst(text) {
  // Strip frontmatter (gray-matter does this; we re-strip for the AST pass)
  const { content, data: fm } = matter(text);
  const tree = remark().use(remarkMdx).parse(content);

  let h1 = 0, h2 = 0, code_block_count = 0;
  let internal_link_count = 0, external_link_count = 0;
  let image_count = 0, images_with_alt = 0, images_without_alt = 0;
  const code_languages = {};
  let untagged_code_blocks = 0;
  const links_internal = [], links_external = [];

  visit(tree, (node) => {
    if (node.type === 'heading') {
      if (node.depth === 1) h1++;
      if (node.depth === 2) h2++;
    }
    if (node.type === 'code') {
      code_block_count++;
      const lang = node.lang || '';
      code_languages[lang || '(untagged)'] = (code_languages[lang || '(untagged)'] || 0) + 1;
      if (!lang) untagged_code_blocks++;
    }
    if (node.type === 'link') {
      const url = node.url || '';
      if (/^https?:\/\//.test(url)) {
        external_link_count++;
        links_external.push(url);
      } else {
        internal_link_count++;
        links_internal.push(url);
      }
    }
    if (node.type === 'image') {
      image_count++;
      if (node.alt && node.alt.trim()) images_with_alt++;
      else images_without_alt++;
    }
    // MDX JSX elements: <Frame>, <Image>, <img>, etc.
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const name = node.name || '';
      if (/^(Frame|Image|img|FrameWithImage)$/i.test(name)) {
        image_count++;
        const altAttr = (node.attributes || []).find(a => a.name === 'alt');
        if (altAttr && altAttr.value && (typeof altAttr.value === 'string' ? altAttr.value.trim() : true)) {
          images_with_alt++;
        } else {
          // Check if a child <img> has alt
          let foundAlt = false;
          visit(node, (child) => {
            if ((child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') && /^(img|image)$/i.test(child.name || '')) {
              const childAlt = (child.attributes || []).find(a => a.name === 'alt');
              if (childAlt && childAlt.value && (typeof childAlt.value === 'string' ? childAlt.value.trim() : true)) {
                foundAlt = true;
              }
            }
            if (child.type === 'image' && child.alt && child.alt.trim()) {
              foundAlt = true;
            }
          });
          if (foundAlt) images_with_alt++;
          else images_without_alt++;
        }
      }
    }
  });

  // Word count (rough): strip MDX nodes, count words in remaining text
  let words = 0;
  visit(tree, 'text', (node) => { words += (node.value.match(/\b\w[\w'-]*\b/g) || []).length; });
  visit(tree, 'paragraph', () => {}); // no-op; words handled above

  const alt_ratio = image_count > 0 ? images_with_alt / image_count : null;
  return {
    frontmatter: fm,
    word_count: words,
    h1_count: h1,
    h2_count: h2,
    code_block_count,
    untagged_code_blocks,
    code_languages,
    internal_link_count,
    external_link_count,
    image_count,
    images_with_alt,
    images_without_alt,
    image_alt_present_ratio: alt_ratio,
    links_external,
  };
}

const paths = walkMdx(DOCS_ROOT).sort();
const rows = [];
for (const p of paths) {
  const rel = relative(REPO, p);
  const text = readFileSync(p, 'utf8');
  try {
    const a = analyzeAst(text);
    rows.push({
      path: rel,
      slug: a.frontmatter?.slug || '',
      title: a.frontmatter?.title || '',
      description_present: !!a.frontmatter?.description,
      sidebar_hidden: !!a.frontmatter?.sidebar?.hidden,
      sidebar_order: a.frontmatter?.sidebar?.order ?? null,
      ...a,
      ...gitMeta(rel),
    });
  } catch (err) {
    console.error('PARSE ERROR', rel, err.message);
  }
}

const out = {
  rows,
  total_pages: rows.length,
  pages_with_images: rows.filter(r => r.image_count > 0).length,
  pages_zero_alt_ratio: rows.filter(r => r.image_count > 0 && r.image_alt_present_ratio === 0).length,
  pages_partial_alt_ratio: rows.filter(r => r.image_count > 0 && r.image_alt_present_ratio !== null && r.image_alt_present_ratio > 0 && r.image_alt_present_ratio < 1).length,
  pages_full_alt_ratio: rows.filter(r => r.image_count > 0 && r.image_alt_present_ratio === 1).length,
  pages_no_description: rows.filter(r => !r.description_present).length,
  pages_hidden: rows.filter(r => r.sidebar_hidden).length,
  total_code_blocks: rows.reduce((s, r) => s + r.code_block_count, 0),
  total_untagged_code_blocks: rows.reduce((s, r) => s + r.untagged_code_blocks, 0),
  code_languages_total: rows.reduce((acc, r) => {
    for (const [lang, n] of Object.entries(r.code_languages)) acc[lang] = (acc[lang] || 0) + n;
    return acc;
  }, {}),
  total_external_links: rows.reduce((s, r) => s + r.external_link_count, 0),
  total_internal_links: rows.reduce((s, r) => s + r.internal_link_count, 0),
};

writeFileSync(join(import.meta.dirname, 'inventory-ast.json'), JSON.stringify(out, null, 2));

console.log('Total pages:', out.total_pages);
console.log('Pages with images:', out.pages_with_images);
console.log('  alt-ratio 0.0 (zero alt):', out.pages_zero_alt_ratio);
console.log('  alt-ratio partial:', out.pages_partial_alt_ratio);
console.log('  alt-ratio 1.0 (full alt):', out.pages_full_alt_ratio);
console.log('Pages without description:', out.pages_no_description);
console.log('Pages hidden in sidebar:', out.pages_hidden);
console.log('Total code blocks:', out.total_code_blocks);
console.log('  untagged:', out.total_untagged_code_blocks);
console.log('  language distribution:', JSON.stringify(out.code_languages_total));
console.log('Total external links:', out.total_external_links);
console.log('Total internal links:', out.total_internal_links);

// Detailed comparison: alt-ratio 0.0 page list
console.log('\nPages with image_alt_present_ratio === 0 (no alt text on any image):');
for (const r of rows.filter(r => r.image_count > 0 && r.image_alt_present_ratio === 0)) {
  console.log(`  ${r.image_count} imgs  ${r.slug}`);
}

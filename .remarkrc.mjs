// remark-lint configuration — structural linting for docs Markdown/MDX.
//
// Complements Vale (prose style) and starlight-links-validator (link targets) by
// checking Markdown/MDX *structure*: heading increments, list/blank-line
// consistency, undefined references, trailing whitespace, hard tabs, etc.
//
// We use remark (not markdownlint) because Astro + Starlight already parse this
// site with remark, so this shares their parser and understands MDX, JSX, and
// Starlight asides natively. See docs/starport-migration/adrs/0005-adopt-remark-lint.md.
//
// Scope (set in the `lint:md` scripts and the remark-lint.yml workflow) is
// `src/content/docs` — matching this repo's Vale scope — so blog, changelog, and
// marketing content keep their own conventions and are not reflowed here.
//
// remark-mdx is applied to every file. That is safe ONLY while `.md` files
// contain no MDX syntax (Astro renders `.md` as plain Markdown, so autofixing
// MDX constructs in a `.md` file would break rendering). Our docs are all `.mdx`
// today; the CI "Guard against MDX syntax in .md files" step keeps that invariant
// if a `.md` file is ever added.
//
// Plugin order matters: parser plugins (frontmatter, gfm, directive, mdx) must
// come before the lint presets so the tree is fully parsed before rules run.
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkMdx from 'remark-mdx'
import remarkPresetLintConsistent from 'remark-preset-lint-consistent'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

export default {
  // remark-stringify settings — used when `--output` rewrites a file. Pinned to
  // the repo's house style so autofix reflow stays minimal instead of flipping
  // every doc to remark's defaults (e.g. `*` bullets, re-indented list items).
  settings: {
    bullet: '-', // unordered lists use `-` (matches existing docs style)
    listItemIndent: 'one', // single space after the list marker
    rule: '-', // thematic breaks as `---`
    fences: true, // fenced code blocks, never indented
    incrementListMarker: true,
  },
  plugins: [
    remarkFrontmatter, // treat `---` YAML frontmatter as frontmatter, not content
    remarkGfm, // tables, autolinks, strikethrough
    remarkDirective, // Starlight asides (:::note[…], :::caution)
    remarkMdx, // MDX / JSX components and {expressions}
    remarkPresetLintConsistent,
    remarkPresetLintRecommended,

    // Rule overrides (tuned so legitimate existing content passes):
    // MD-style hard-wrap is intentionally NOT enforced — Vale + author judgment
    // own prose. `maximum-line-length` isn't in the recommended preset, so no
    // override is needed for that.
    //
    // Starlight link syntax uses site-absolute paths like `/docs/start-here/welcome/`
    // that have no on-disk target during a lint pass; link *targets* are validated
    // separately by starlight-links-validator during `build`, so we don't duplicate
    // that here.
  ],
}

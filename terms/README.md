# Terms

The termbase for the docs in `src/content/docs`, checked and rendered with
[`manni term`](https://hawkeyexl.github.io/manni/term/). Each `.md` file here is
one term page: YAML frontmatter with `type: term`, a `label`, and a
`definition`, and no body. Every value a docs page lists under `concepts:` must
name one of these terms by its label, id, or an alt-label.

The term pages are the source. Three things are generated from them and
committed:

| Generated file | What it's for |
| --- | --- |
| `src/partials/glossary/for-docs.md` | Definition list embedded by the [Promptless for Docs glossary](../src/content/docs/docs/for-docs/reference/glossary.mdx) |
| `src/partials/glossary/governance.md` | Definition list embedded by the [PIG glossary](../src/content/docs/docs/governance/reference/glossary.mdx) |
| `.vale/styles/Terms/` | Vale style that flags a term written in the wrong case, a hidden-label, and an acronym used before its expansion |

Don't edit the generated files by hand. Edit the term pages, then run
`npm run terms:write`.

## Layout

| Directory | Holds | Rendered in |
| --- | --- | --- |
| `for-docs/` | Promptless for Docs terms | the Promptless for Docs glossary |
| `governance/` | Promptless Instruction Governance (PIG) terms | the PIG glossary |
| `topics/` | Subject areas, vendors, and third-party tools that pages tag in `concepts:`, such as `security`, `Slack`, or `Vale` | no glossary; still checked, linted, and used by the Vale style |

A term used by both products goes in the directory of the product that uses
it most. Its definition must be accurate for both.

The glossaries hold Promptless's own terms, plus general terms that some
readers may not know, such as `docs-as-code` for engineers or `GitOps` for
writers. Keep vendor and third-party product names out of them. Put those
terms in `topics/`. In `for-docs/` and `governance/` definitions, name a
vendor only when the term can't be defined without one.

`term.template.yaml` is the empty structure template that `manni lint
structure` routes term pages to, since they have no body.

## Fields

- `label`: the preferred name, in the casing the docs use. The Vale style
  enforces this casing, so `GitHub App` flags `GitHub app`, and a lowercase
  label such as `doc collection` flags `Doc Collection`.
- `alt-labels`: other admitted names, such as a plural. An all-caps
  alt-label, such as `SSO`, also generates a Vale rule that warns until the
  page spells the term out first, as in `single sign-on (SSO)`.
- `hidden-labels`: names the docs must not use. The Vale style warns and
  suggests the label instead.
- `definition`: one or two sentences, held to the same Vale styles as the
  docs pages.

The [terminology reference](https://hawkeyexl.github.io/manni/term/reference/terminology/)
lists every field.

## Common tasks

Run these from the repository root with Node 24 or later. `manni term lint` and
`manni term write -f vale` also need [Vale](https://vale.sh) on `PATH`, and a
`vale sync` first.

| Task | Command |
| --- | --- |
| Add a term for every `concepts:` value no term claims | `npx manni term fill -o terms/<directory>/` (add `--dry-run` to preview). With a model provider configured, it drafts each definition and records it in `meta-provenance`; otherwise it writes stubs. Review or write each definition, then delete the `meta-provenance` block. |
| Check the set and every `concepts:` reference | `npx manni term check` |
| Lint the definitions | `npx manni term lint` |
| Regenerate the glossary partials and the Vale style | `npm run terms:write` |
| Check that the generated files are current | `npm run terms:check` |

## CI

The `terms` job in `.github/workflows/manni.yml` fails a pull request when a
`concepts:` value names no term, the set is inconsistent, a definition fails
Vale, or a generated file is stale. The `vale` workflow runs the Terms style
over the docs pages. There its casing rules are warnings, not errors, because
Vale also lints frontmatter values such as `id` and `slug`, where lowercase
identifiers like `for-docs-connect-triggers-jira` are correct. The workflow's
error filter reads each rule's own level, which the generated files set to
`error`, so it excludes the `Terms.` rules by name. Run Vale locally to see
their warnings. See
[ADR 0009](../adrs/0009-adopt-manni-term.md).

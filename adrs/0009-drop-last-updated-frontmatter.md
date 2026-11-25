# Drop the `last-updated` frontmatter field

- Status: accepted
- Date: 2026-11-15
- Deciders: Prithvi
- Context source: #team-docs discussion, 2026-11-15

## Context and Problem Statement

[ADR 0005](0005-adopt-manni-vocabularies.md) put a git-derived `last-updated`
date in every docs page's frontmatter, for agents judging freshness, and had
`manni meta validate` fail when the date disagreed with git. Nothing reads the
field. Starlight shows no date, because its own `lastUpdated` option is off.
The `.md` endpoint strips frontmatter, so `llms.txt` and agents never see it,
and the MCP index ignores it. The only consumer is the check that validates
it. That check also fails on `main` after squash merges, which give a page a
new last commit that the stamp written on the branch doesn't match. Each fix
is another restamp PR.

## Decision Drivers

- Keep frontmatter that readers, the build, or agents use, the driver behind
  [ADR 0004](0004-drop-docmeta-timestamp.md).
- Don't store a value in each page that git already records.
- Keep `main` green without follow-up restamp PRs.

## Considered Options

- Keep `last-updated` and restamp after each squash merge.
- Drop `last-updated` from the pages and from manni's derived fields.

## Decision Outcome

Chosen option: **drop `last-updated`**, because git already provides the
internal freshness signal and the stored copy only adds a check that breaks.
If the site should show readers a date later, render it from git at build
time instead of storing it in the page. Adding the field back is a one-line
`derive` change plus one `npx manni meta derive` run.

The field was removed from 131 docs pages, and `last-updated` was removed from
`meta.derive.fields` in `manni.config.yaml`. `AGENTS.md` and the `manni.yml`
comments no longer tell authors to restamp it. `created` and `owner` are still
stamped into `docs.metadata.yaml`.

This partially supersedes ADR 0005, only its `last-updated` decision. The rest
of ADR 0005 stays accepted.

### Consequences

- Good: a page body edit no longer needs a restamp commit, and a squash merge
  no longer leaves `main` failing `derived:stale` on `last-updated`.
- Good: one fewer field per page that can drift from git.
- Tradeoff: page frontmatter carries no date. Anyone who needs one reads
  `git log` for the page.
- Follow-up: none required. If readers need a visible date, turn on
  Starlight's `lastUpdated`, which reads git at build time.

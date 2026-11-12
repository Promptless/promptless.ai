# Adopt manni and its strict metadata vocabularies

- Status: accepted
- Date: 2026-10-16
- Deciders: Promptless docs team (requested through a Promptless dashboard task, 2026-10-16)
- Context source: [manni vocabularies reference](https://hawkeyexl.github.io/manni/meta/reference/schemas/manni-vocabularies/)

## Context and Problem Statement

[Starport ADR 0006](../docs/starport-migration/adrs/0006-adopt-docmeta.md) adopted
docmeta to validate docs frontmatter against three schemas: a Starlight mirror,
Google's Open Knowledge Format (`google:okf:0.1`), and a custom extension schema.
docmeta is now deprecated. Its final release points users to
[`@hawkeyexl/manni`](https://www.npmjs.com/package/@hawkeyexl/manni) and its
`manni meta` command, which validates the same way and also ships a family of
metadata vocabularies. OKF only required `type`, so pages described almost
nothing about who they serve, how they connect, or who maintains them.

## Decision Drivers

- Replace a deprecated tool before it falls behind Node and Starlight upgrades.
- Give readers, search, and agents richer page metadata: intent, audiences,
  related pages, risks, and the questions each page answers.
- Keep maintainer metadata, such as owners and personas, out of page frontmatter.
- Avoid hand-maintained dates that go stale, the problem
  [ADR 0004](0004-drop-docmeta-timestamp.md) removed `timestamp` to solve.

## Considered Options

- Keep docmeta 1.2.0 and OKF.
- Move to manni with its default schema set.
- Move to manni with the open and strict versions of six chosen vocabularies.

## Decision Outcome

Chosen option: **manni with six vocabularies and their strict overlays**,
because it replaces the deprecated tool and records each fact in a checked form.

`manni.config.yaml` sets `defaults: false` and judges each page in
`src/content/docs` against this set, in order:

1. `astro:starlight:0.41`, manni's built-in Starlight schema. It replaces the
   hand-authored `schemas/starlight-frontmatter.schema.json` mirror, so the
   repo no longer keeps a copy in sync with Starlight. It requires `title` and
   checks the form of the other Starlight fields that are present.
2. Each vocabulary followed by its strict overlay: `manni:core:1.0.0`,
   `manni:stewardship:1.1.0`, `manni:audience:1.0.0`, `manni:lifecycle:1.0.0`,
   `manni:structure:1.0.0`, and `manni:ai-context:1.0.0`. A strict overlay
   checks the form of values that are present. Examples are kebab-case ids,
   list-only keywords, full dates, and the seven named risk flags. It doesn't
   require extra keys.
3. `tgdp:templates:1.1`, built into manni. It requires a non-empty `type` and
   recommends the 25
   [Good Docs Project template slugs](https://www.thegooddocsproject.dev/template)
   without enforcing them; the strict overlay is off. Pages use `concept`,
   `how-to`, `reference`, `quickstart`, `installation-guide`,
   `troubleshooting`, `glossary`, and `contact-support`.

The repo keeps no custom schema. `manni:core:1.0.0` already requires `title`
and `description` and sets the form of `id`. No schema in the set requires
`id` or checks `tags`.

Each vocabulary marks every field as belonging in the page or in external
metadata. Fields readers and agents act on go in frontmatter. These are
`id`, `keywords`, `language`, `audiences`, `intent`, `lifecycle`,
`applies-to`, `concepts`, page links, `risks`, `sample-questions`, and
`last-updated`. Maintainer fields go in `docs.metadata.yaml`, keyed by each
page's `id`. These are `owner`, `created`, `personas`, `journeys`,
`visibility`, `source-of-truth`, and `meta-provenance`.

`created`, `last-updated`, and `owner` are managed fields. `npx manni meta derive`
stamps them from git history and CODEOWNERS, and `manni meta validate` fails
when a stamp disagrees with that evidence. These are manni's merge-safe fields,
so a stamp written on a branch stays correct after a squash merge. This adopts
the "Automate from git" option that ADR 0004 rejected. The date now has a
consumer, agents judging freshness, and it can't go stale without failing CI.

Every page's machine-proposed values are listed in its `meta-provenance` entry.
Reviewers delete that entry once they've checked the values.

### Consequences

- Good: docmeta is gone; `manni meta validate` runs in CI as `docmeta validate`
  did, with the same inline annotations.
- Good: every page states its intent, audiences, concepts, risks, related
  pages, and sample questions in a validated form.
- Tradeoff: a PR that changes a page's body must restamp `last-updated` with
  `npx manni meta derive`, or the `manni` check fails. CI checks out full
  history for the comparison.
- Tradeoff: no schema requires `id`, but `manni meta validate` fails without
  it. `owner` and `created` live in `docs.metadata.yaml` under the page's
  `id`, so a page without one fails `derived:stale` because derive has no
  entry to stamp. A `docs.metadata.yaml` entry whose page dropped its `id`
  fails as an orphan.
- Tradeoff: `tags` and the `type` slug list aren't validated. A misspelled
  `type`, such as `how-too`, passes CI.
- Tradeoff: `type` moved from the repo's own `landing`, `guide`, and
  `reference` values to TGDP slugs. Former landing pages are `concept`, and
  each former guide is `how-to`, `concept`, `quickstart`,
  `installation-guide`, or `troubleshooting`. The `tags` lists still carry the
  old values.
- Not filled: `authors`, `reviewed-by`, `last-reviewed`, and `provenance`
  change at merge time. They would need a derive run on `main` to stay current.
  `stakeholders`, `review-interval`, and `verified-against` are team
  decisions no evidence records. Add them when the team sets a review policy.
- Supersedes [Starport ADR 0006](../docs/starport-migration/adrs/0006-adopt-docmeta.md)
  and the `timestamp`-automation reasoning in [ADR 0004](0004-drop-docmeta-timestamp.md).

## Pros and Cons of the Options

### Keep docmeta 1.2.0 and OKF

- Good: No change for contributors.
- Bad: Deprecated, and OKF describes little beyond `type`.

### Move to manni with its default schema set

- Good: Smallest config.
- Bad: Adds OKF, seven-action, evals, graph, and citations vocabularies nobody
  asked for, and leaves the strict overlays off.

### Move to manni with six vocabularies and strict overlays

- Good: Only the requested vocabularies, each held to its strict form, and
  no schema files to maintain in the repo.
- Bad: Longer config, and contributors restamp derived fields.

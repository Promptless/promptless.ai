---
title: How Mautic keeps docs up to date automatically
description: Mautic's docs fell entire release versions behind. With Promptless drafting a docs PR for every code PR, 129 Promptless docs PRs merged in about four months, roughly 3.5 times faster than docs written by hand.
routePath: /customers/mautic
---
Mautic, the open-source marketing automation project, published a post on its own blog in September 2026 about how it keeps its docs up to date with Promptless: [How Mautic pairs Promptless with human review to catch up on docs](https://mautic.org/blog/keep-docs-up-to-date-automatically/), by Ayu Adiati. This page summarizes that post. The quotes and figures are Mautic's own.

## Results

- **129** Promptless docs PRs merged in about four months. Over more than four years, 392 PRs from human contributors were merged.
- **27 days** average from code merge to docs merge for Promptless updates. Docs written by hand averaged 98 days. "That's roughly 3.5 times faster." Turnaround times come from a sample of merged PRs.
- **Release gap:** at one point the app had moved to version 7.0 while the docs were stuck at 5.2, two versions behind. Docs started catching up around 7.1. By 7.2, they were moving fast, right when the automated Promptless workflow began.

## The challenge: docs fell behind by entire release versions

Mautic is built by volunteers. Developers who open pull requests on mautic/mautic also juggle day jobs and other feature work.

> "Writing docs updates is important, but it rarely felt urgent, so it kept getting pushed aside. It wasn't anyone's fault. It's just what happens when docs depend on people who are already stretched thin." (Ayu Adiati, Mautic)

The user documentation and developer documentation fell behind "not by days, but by entire release versions," and each docs repository keeps a branch per supported Mautic version.

## The workflow: a docs PR for every code PR

Mautic found Promptless through the WriteTech Hub community and connected it to both docs repositories, across every active version branch.

1. **A developer opens a PR on mautic/mautic.** Promptless writes a docs update for the change. While the code PR is unmerged, the docs PR stays a draft.
2. **The code PR merges.** Promptless marks the docs PR ready for review.
3. **The code changes in review.** When the developer adds more changes, Promptless updates the docs draft to match.
4. **People review it.** The developer confirms the draft matches what they built, and the Education Team reviews grammar, wording, and style as it would any docs contribution.

Mautic started with Promptless posting suggestions on its dashboard for the Education Team to review, then opted into the fully automated workflow once it saw how consistently Promptless followed its style guide.

> "That trial period built trust in the tool before we handed over more of the process." (Ayu Adiati, Mautic)

## A person still makes the final call

Every Promptless draft goes through the same review as any other contribution. Review caught a new section that would only have duplicated existing content (Promptless withdrew the PR), and a draft that described a button and a limit already removed from the code (Promptless checked the codebase and fixed it). Promptless has gotten progressively more accurate, "partly because we train it directly on what to remember, and partly because it picks up on patterns from our corrections."

> "Nothing beats a human check before docs go live, and that's exactly how we use Promptless: a fast first draft, with a person making the final call." (Ayu Adiati, Mautic)

## Promptless adapts to Mautic's workflow

Mautic's Education Team is in the EU and the Promptless team works US hours, yet "most questions get an answer within hours, or by their next morning at the latest." Fixes usually ship within days, sometimes a week.

> "When something doesn't fit Mautic's setup, they don't ask us to change how we work. They jump on a call, dig in with us, and adjust Promptless to match our workflow instead." (Ayu Adiati, Mautic)

> "Promptless helped us catch up without asking already-busy developers to do more." (Ayu Adiati, Mautic)

[Book a demo](https://promptless.ai/meet?content=customer-facing-docs#book). Every plan includes a 14-day free trial, and eligible open-source projects can use Promptless free through the [open-source program](https://promptless.ai/docs/for-docs/start-here/open-source-quickstart.md).

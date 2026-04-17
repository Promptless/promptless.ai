# SEO Experiments: Google Search Result Click-Through Rate

## Hypothesis

Changing the meta description (and potentially title) shown in Google search results
will increase click-through rates, especially for branded queries like "promptless company"
where CTR is currently very low despite high impressions.

---

## Experiment 1: Homepage meta description change

**Date:** 2026-03-23

**What changed:** Meta description in `src/content/website/home.mdx` frontmatter.

**Title (unchanged):** Promptless | Automatic updates for your customer-facing docs

### Before

**Description:** Eliminate docs drift and automate the most painful parts of docs maintenance.

### After

**Description:** Plugs into your GitHub, Slack, and support tools. Spots changes that affect your docs, assembles context from across your company, and drafts updates for your team to review and publish.

### Rationale

- "Docs drift" is insider jargon that cold searchers don't understand.
- "Automate the most painful parts of docs maintenance" is vague — could describe a CMS, linter, or hosting platform.
- The new description is mechanical and literal: it names the inputs (GitHub, Slack, support tools), the action (spots changes, assembles context, drafts updates), and the human-in-the-loop (your team reviews and publishes).
- Goal is to pass the 5-second comprehension test for someone who just heard the name "Promptless" and is investigating.

### Baseline metrics (Google Search Console, ~90 days before change)

#### Recent period (shorter window)

| Query                | Clicks | Impressions | CTR    |
|----------------------|--------|-------------|--------|
| promptless           | 38     | 75          | 50.7%  |
| promptless ai        | 16     | 23          | 69.6%  |
| promptless company   | 1      | 64          | 1.6%   |
| prompt less          | 1      | 1           | 100%   |
| gopromptless.ai      | 0      | 12          | 0%     |
| promptless meaning   | 0      | 4           | 0%     |

#### Longer period

| Query                                    | Clicks | Impressions | CTR    |
|------------------------------------------|--------|-------------|--------|
| promptless                               | 118    | 292         | 40.4%  |
| promptless ai                            | 43     | 95          | 45.3%  |
| prompt less                              | 4      | 5           | 80.0%  |
| promptless company                       | 2      | 154         | 1.3%   |
| promptless yc                            | 1      | 9           | 11.1%  |
| write the docs portland 2026             | 0      | 38          | 0%     |
| gopromptless.ai                          | 0      | 21          | 0%     |
| promptless meaning                       | 0      | 8           | 0%     |
| automatically update product documentation | 0    | 8           | 0%     |

### Key observations

- Nearly 100% branded traffic — almost no organic discovery from product-category searches.
- "promptless company" has 154 impressions but only 2 clicks (1.3% CTR) — people searching to understand the company aren't compelled to click.
- Non-branded queries ("automatically update product documentation", "write the docs portland 2026") get impressions but zero clicks.
- The old description didn't differentiate Promptless from docs hosting platforms like Mintlify or ReadMe.

### Success criteria

- "promptless company" CTR increases above 5%.
- Non-branded query clicks move from 0 to >0.
- Overall branded CTR remains stable or improves.

### How to measure

Check Google Search Console 4-6 weeks after the change is deployed and indexed.
Note: Google may take 1-2 weeks to re-crawl and update the snippet.

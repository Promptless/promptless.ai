---
title: Agent Score
description: Free tool that scores how well AI agents can read a docs site, from 0 to 100, using the open-source afdocs checks. Public reports, score history, fixes, and a CI recipe.
routePath: /agent-score
---
Agent Score runs [afdocs](https://github.com/agent-ecosystem/afdocs) against a docs site and grades it from 0 to 100 across 28 checks in 7 categories. There is no signup and no email gate. Every scan gets a public report at `https://promptless.ai/agent-score/<host>[/<path>]`, for example [docs.promptless.ai](https://promptless.ai/agent-score/docs.promptless.ai.md), with per-check fixes, score history, and what changed since the last scan. Append `.md` to any report URL for its markdown version.

## Score a site

Open https://promptless.ai/agent-score and enter the URL of a docs site. A scan takes 30 to 120 seconds. Sites are keyed by exact host and path, so `docs.example.com` and `example.com/docs` are scored separately. Anyone can rescan a site; a site scanned in the last 10 minutes returns the cached result.

Agents can use the public JSON API at `https://api.gopromptless.ai/public/free-tools/agent-score`:

- `POST /scans` with `{"url": "https://docs.example.com"}` starts a scan and returns `scanId` and `slug`.
- `GET /scans/<scanId>` returns `status` (`queued`, `running`, `complete`, or `failed`) and `progress`.
- `GET /sites/<slug>` returns the latest result, history, and changes since the previous scan.
- `GET /sites/<slug>/badge.svg` returns an SVG badge.
- `GET /leaderboard?sort=top|recent&limit=24` lists scored sites.

## Run it yourself

afdocs is open source (MIT) by [Dachary Carey](https://github.com/dacharyc) and implements the [Agent-Friendly Docs Spec](https://agentdocsspec.com/spec/web/). Documentation lives at [afdocs.dev](https://afdocs.dev). It needs Node 22 or later:

```bash
npx afdocs@latest check https://docs.example.com --format scorecard
npx afdocs@latest check https://docs.example.com --fixes --verbose
```

## Automate it

The hosted scanner runs `afdocs check <url> --format json --score --sampling deterministic`, so the same command in CI produces the same numbers. A daily GitHub Actions job that fails below a score of 90:

```yaml
name: Agent Score
on:
  schedule:
    - cron: '0 17 * * *'
  workflow_dispatch:
jobs:
  afdocs:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: |
          set +e
          OUTPUT=$(npx -y afdocs@latest check "https://docs.example.com" --format json --score --sampling deterministic)
          set -e
          SCORE=$(printf '%s' "$OUTPUT" | jq -r '.scoring.overall // empty')
          [ -n "$SCORE" ] || { echo "::error::Could not parse the afdocs score"; exit 1; }
          [ "$SCORE" -ge 90 ] || { echo "::error::Agent Score $SCORE is below 90"; exit 1; }
```

For vitest, add `agent-docs.test.ts` with `import { describeAgentDocsPerCheck } from 'afdocs/helpers'; describeAgentDocsPerCheck();` and put the site URL in `agent-docs.config.yml`.

## Methodology

Checks are weighted by tier: critical 10, high 7, medium 4, low 2. Warnings earn partial credit, skipped checks are excluded, and some blockers cap the score (no llms.txt caps it at 59). Grades: A+ is 100, A is 90 to 99, B is 80 to 89, C is 70 to 79, D is 60 to 69, and F is below 60. See [how the score is calculated](https://afdocs.dev/agent-score-calculation).

- **Content Discoverability** (7 checks): llms.txt exists, is valid, fits size limits, links resolve and point to markdown, and pages point agents to it.
- **Markdown Availability** (2 checks): `.md` URLs and `Accept: text/markdown` content negotiation.
- **Page Size and Truncation Risk** (6 checks): server-side rendering, page and transfer size, where content starts, and single-fetch completeness.
- **Content Structure** (5 checks): tabbed content, section headers, code fences, link portability, and embedded data.
- **URL Stability and Redirects** (2 checks): real error status codes and same-host redirects.
- **Observability and Content Health** (3 checks): llms.txt coverage, markdown and HTML parity, and cache headers.
- **Authentication and Access** (3 checks): login walls, alternative access paths, and bot protection.

## Why it matters

Developers send coding agents such as Claude Code, Cursor, and ChatGPT to read docs before they do. When an agent cannot parse a page, nobody sees an error; the developer just gets a worse answer. Agent Score measures that, and the same open-source command keeps the score from slipping in CI.

## Promptless keeps docs agent-ready automatically

Promptless is an AI agent that drafts documentation updates when your product changes. [Book a demo](https://promptless.ai/demo) or read [We scored 100 on agent-friendly docs. Here's why that's not enough](https://promptless.ai/blog/technical/agent-friendly-docs-necessary-not-sufficient.md).

Built by Promptless. Powered by afdocs.

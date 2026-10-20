---
title: Agent Score
description: Free tool that scores how well AI agents can read a docs site, from 0 to 100, using the open-source afdocs checks. Public reports, score history, and fixes.
routePath: /agent-score
---
Agent Score runs [afdocs](https://github.com/agent-ecosystem/afdocs) against a public docs site and returns a score out of 100 across 28 checks in 7 categories, a fix for each failing check, and score history. No signup. Every report is public at `https://promptless.ai/agent-score/<host>[/<path>]`, for example [promptless.ai/docs](https://promptless.ai/agent-score/promptless.ai/docs.md). Append `.md` to any report URL for its markdown version.

## Score a public site

Open https://promptless.ai/agent-score and enter the URL of a docs site. A scan takes about a minute. `docs.example.com` and `example.com/docs` are scored separately. A site scanned in the last 10 minutes returns the cached result.

The public JSON API lives at `https://api.gopromptless.ai/public/free-tools/agent-score`:

- `POST /scans` with `{"url": "https://docs.example.com"}` starts a scan and returns `scanId` and `slug`.
- `GET /scans/<scanId>` returns `status` (`queued`, `running`, `complete`, or `failed`) and `progress`.
- `GET /sites/<slug>` returns the latest result, history, and changes since the previous scan.
- `GET /sites/<slug>/badge.svg` returns an SVG badge.
- `GET /leaderboard?sort=top|recent&limit=24` lists scored sites.

## Score a private site

Agent Score is a hosted run of afdocs and nothing more. The same command on a staging site, a localhost build, or docs on your VPN gives the same score. afdocs is MIT-licensed, written by [Dachary Carey](https://github.com/dacharyc), and implements the [Agent-Friendly Docs Spec](https://agentdocsspec.com/spec/web/). Promptless adds no checks and changes no weights. Needs Node 22 or later:

```bash
npx afdocs@latest check https://docs.example.com --format scorecard
npx afdocs@latest check https://docs.example.com --fixes --verbose
```

The hosted scanner runs `afdocs check <url> --format json --score --sampling deterministic`.

## Checks

28 checks in 7 categories: content discoverability, markdown availability, page size, content structure, URL stability, observability, and authentication. Every check is a yes-or-no test an HTTP client can run; none of them read your prose. See the [check reference](https://afdocs.dev/checks/) and [how the score is calculated](https://afdocs.dev/agent-score-calculation).

## Auditing the content itself

Agent Score checks plumbing, not content. It cannot tell you whether your docs answer the questions agents get asked. For that, [sign up for Promptless](https://accounts.gopromptless.ai/sign-up) and run a content strategy audit on your docs. Free 14-day trial, no credit card. See also [how we scored 100 on agent-friendly docs](https://promptless.ai/blog/technical/agent-friendly-docs-necessary-not-sufficient.md).

Built by Promptless. Powered by afdocs.

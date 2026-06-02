---
name: check-broken-links
description: |
  Crawl the docs site and report broken links, redirects, and warnings.
  Runs `scripts/check_links.py`, which wraps `linkchecker` and parses the
  CSV output into a terminal summary plus timestamped html and csv reports
  under `tmp/broken-link-reports/`.

  Use this skill when:
  - The user asks to "check for broken links", "find broken links", "audit
    links", "run linkchecker", or similar
  - Verifying internal links after a large nav, redirect, or content move
  - Pre-flight before a deploy or a significant docs reorganization
  - Investigating a reported 404 or redirect chain

  Default scope is the local dev server (`http://localhost:4321`). For a
  production audit, pass `https://promptless.ai` (or any sub-URL) as the
  argument.
---

# Check Broken Links

Walks the docs site and reports broken links, redirects, and warnings. Thin Python wrapper around `linkchecker` with a parser that prints a readable terminal summary.

## When to use

- The user asks to find/check/audit broken links
- After a redirect change, sidebar restructure, or large content move
- Before a deploy where link integrity matters
- To investigate a specific 404 or redirect chain

If the user just wants to verify a *single* URL is reachable, this is overkill — `curl -I` is faster. Use this skill for crawls.

## Prerequisites

One of:
- `uv` installed (`brew install uv`) — the script declares `linkchecker` as an inline PEP 723 dependency, so `uv run` fetches it automatically. **Preferred.**
- `linkchecker` installed system-wide (`pip install linkchecker` or `pipx install linkchecker`) — then run via plain `python`.

If neither is available, tell the user and stop. Do not try to reimplement the script in bash.

## How to run

The script is at `scripts/check_links.py`. It takes one optional positional argument: the root URL to crawl. Default is the local dev server.

### Local dev (default)

```bash
# Start the dev server in another shell first
npm run dev

# Then crawl
uv run scripts/check_links.py
# or, with linkchecker installed system-wide:
python scripts/check_links.py
```

Local runs are fast and avoid hammering production. Prefer this for routine checks.

### Production

```bash
uv run scripts/check_links.py https://promptless.ai
```

Production crawls hit external links too (`--check-extern`), so they're slower and noisier. Use when you specifically want to audit the live site.

### Scoped crawl

The crawler stays on the host of the starting URL but follows any in-host link it finds, so a sub-path argument narrows the *entry point* but not the full crawl. If you want to limit the crawl to one section, pass that section's root URL and accept that it may still follow site-wide nav links:

```bash
uv run scripts/check_links.py https://promptless.ai/docs/getting-started/welcome
```

## Output

- Terminal: `N checked, M broken, K warnings`, plus tables of broken and warning rows (url, parent, result/warning).
- `tmp/broken-link-reports/broken-link-report_{host}_{stamp}.html` — full linkchecker HTML report (browse this for context).
- `tmp/broken-link-reports/broken-link-report_{host}_{stamp}.csv` — semicolon-delimited raw output.

The `tmp/broken-link-reports/` directory is gitignored.

## Interpreting results

- **broken** (`valid == False`) — needs fixing. Open the HTML report or grep the CSV for the broken URLs, then trace each `parent` page back to the source file in `src/content/`.
- **warnings** (`valid == True` with a warning string) — usually redirects, slow responses, or 3xx chains. Worth a look but rarely block a deploy. Common cases:
  - `301`/`302` from external links — fine, the destination resolved.
  - `429`/timeouts on external hosts (GitHub, social) — flaky, not a real bug.
- A **clean** run prints `clean.` and writes no rows to the CSV (the file may still exist with only comment headers).

## Triaging broken links

When the script reports broken links, do this:

1. Group the broken rows by `parent` page — one source file often produces several bad outbound links.
2. For each `parent`, find the source under `src/content/` (`grep -r` for a distinctive slug works).
3. Decide per link:
   - **Internal link to a moved page** → check `astro.config.mjs` redirects and `src/lib/generated/redirects.json`. If a redirect should exist, add it; otherwise update the link.
   - **External link that 404s** → update or remove. Don't add an unverified replacement.
   - **External link with a transient failure** (timeout, 5xx, 429) → re-run before assuming it's broken.
4. Re-run the script after fixes to confirm.

Do not "fix" warnings unless they hide a real problem — chasing every 301 wastes time.

## Notes

- The crawl uses `--no-robots` so it ignores `robots.txt`. Keep this; the docs site's `robots.txt` is tuned for search engines, not internal audits.
- `--check-extern` is on by default. If a production run is taking too long because of slow external hosts, edit the script to drop that flag for a fast internal-only pass.
- The CSV parser only reads the first 7 columns (`url;parent;base;result;warning;info;valid`) and ignores the rest. If linkchecker changes its column order, update `COLUMNS` in the script.

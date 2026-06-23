---
name: check-broken-links
description: |
  Crawl a **local** running copy of the docs site and report broken
  links, redirects, and warnings. Runs `scripts/check_links.py`, which
  wraps `linkchecker` and parses its CSV output into a terminal summary
  plus timestamped html and csv reports under `tmp/broken-link-reports/`.

  This skill is for verifying your own in-progress changes against a
  local dev server. The full workflow is: install deps → start
  `npm run dev` in the background → wait for `localhost:4321` to come
  up → crawl → triage broken rows → stop the dev server.

  Use this skill when:
  - The user asks to "check for broken links", "find broken links",
    "audit links", "run linkchecker", or similar
  - Verifying internal links after a nav change, redirect tweak, page
    rename, or content move — before merging
  - Investigating a reported 404 or redirect chain in local changes

  Production audits (`https://promptless.ai`) are supported but rare —
  prefer local so you're testing the diff you're about to ship, not
  whatever is currently deployed.
---

# Check Broken Links

Walks a **locally running** docs site and reports broken links, redirects, and warnings. The point is to catch link breakage in your current working copy *before* it ships — crawling production only tells you what's already live.

## When to use

- The user asks to find/check/audit broken links
- After a redirect change, sidebar restructure, page rename, or content move — to verify the change before merging
- To investigate a specific 404 or redirect chain in local changes

If the user just wants to verify a *single* URL, this is overkill — `curl -I` is faster. Use this skill for crawls.

## Prerequisites

Two stacks need to be ready: the docs site (Node) and the crawler (Python).

**Node side (to run the docs site):**
- Node ≥ 20 (see `engines` in `package.json`)
- `npm install` has been run at least once (check for `node_modules/`)

**Python side (to run the crawler):**
- `uv` installed (`brew install uv`) — the script declares `linkchecker` as an inline PEP 723 dep, so `uv run` fetches it on demand. **Preferred.**
- *Or* `linkchecker` installed system-wide (`pip install linkchecker` / `pipx install linkchecker`) and run with plain `python`.

If a prerequisite is missing, tell the user what's missing and stop. Do not try to reimplement the script in bash or skip the dev server.

## The workflow

Do these steps in order. Don't skip the "wait for ready" step — `linkchecker` will report every URL as broken if the server isn't listening yet.

### 1. Install deps (if needed)

```bash
# Only if node_modules/ is missing or stale
npm install
```

### 2. Start the dev server in the background

The dev server is `npm run dev` — Astro binds to **`http://localhost:4321`** by default (see `AGENTS.md`). Start it as a background process so the crawl can run in the same session:

```bash
npm run dev
```

Run this via the Bash tool's `run_in_background: true`. **Do not** run it foreground — it never exits, and you need the shell free to run the crawl.

### 3. Wait until the server is actually serving

Astro prints `Local: http://localhost:4321/` once it's ready, which usually takes 5–15 seconds. Poll until you get a 200:

```bash
for i in {1..30}; do
  curl -fsS -o /dev/null http://localhost:4321/ && { echo "up"; break; }
  sleep 1
done
```

If it never comes up: read the background shell's output, surface the error, and stop. Common causes: port 4321 in use, `npm install` not run, build error in `src/`.

### 4. Run the crawl

```bash
uv run scripts/check_links.py
# or, with linkchecker installed system-wide:
python scripts/check_links.py
```

The script defaults to `http://localhost:4321`, so no argument is needed for the standard case. If a user changed `--port`, pass the matching URL explicitly:

```bash
uv run scripts/check_links.py http://localhost:4322
```

### 5. Stop the dev server

When the crawl finishes, kill the background `npm run dev` process. Leaving it running ties up the port and confuses the next session.

## Scoped crawl (optional)

The crawler stays on the host of the starting URL but follows any in-host link it finds, so a sub-path narrows the *entry point* but not the full crawl. Useful for spot-checking one section:

```bash
uv run scripts/check_links.py http://localhost:4321/docs/getting-started/welcome
```

## Production crawl (rare)

Only crawl `https://promptless.ai` when the user explicitly asks to audit the live site (e.g. "are there any broken links in prod right now?"). Pass the URL as the argument and skip steps 1–3 and 5:

```bash
uv run scripts/check_links.py https://promptless.ai
```

Prod crawls are slower, hammer external hosts, and tell you nothing about uncommitted changes. Local first, always.

## Output

- Terminal: `N checked, M broken, K warnings`, plus tables of broken and warning rows (url, parent, result/warning).
- `tmp/broken-link-reports/broken-link-report_{host}_{stamp}.html` — full linkchecker HTML report (browse this for context).
- `tmp/broken-link-reports/broken-link-report_{host}_{stamp}.csv` — semicolon-delimited raw output.

The `tmp/broken-link-reports/` directory is gitignored.

## Interpreting results

- **broken** (`valid == False`) — needs fixing. Trace each `parent` page back to the source file in `src/content/`.
- **warnings** (`valid == True` with a warning string) — usually redirects, slow responses, or 3xx chains. Worth a look but rarely block a merge. Common cases:
  - `301`/`302` from external links — fine, the destination resolved.
  - `429`/timeouts on external hosts (GitHub, social) — flaky, not a real bug.
- A **clean** run prints `clean.` and writes no rows to the CSV (the file may still exist with only comment headers).

When crawling localhost, broken external links also surface (e.g. a dead `https://example.com` referenced in MDX). Those are still real bugs — the dev server just serves the page that contains them.

## Triaging broken links

1. Group the broken rows by `parent` page — one source file often produces several bad outbound links. The `parent` URL is the localhost one; map it back to the source.
2. For each `parent`, find the source under `src/content/`:
   - URL like `http://localhost:4321/docs/foo/bar` → look under `src/content/docs/` for `foo/bar.mdx` (or `foo/bar/index.mdx`).
   - URL like `http://localhost:4321/blog/foo` → `src/content/blog/foo.mdx`.
   - When in doubt, `grep -r` for a distinctive slug from the URL.
3. Decide per link:
   - **Internal link to a moved page** → check `astro.config.mjs` redirects and `src/lib/generated/redirects.json`. If a redirect should exist, add it; otherwise update the link.
   - **External link that 404s** → update or remove. Don't add an unverified replacement.
   - **External link with a transient failure** (timeout, 5xx, 429) → re-run before assuming it's broken.
4. Re-run the script (Astro hot-reloads, so no server restart needed) to confirm.

Do not "fix" warnings unless they hide a real problem — chasing every 301 wastes time.

## Notes

- The crawl uses `--no-robots` so it ignores `robots.txt`. Keep this; the docs site's `robots.txt` is tuned for search engines, not internal audits.
- `--check-extern` is on by default. If a production run is taking too long because of slow external hosts, edit the script to drop that flag for a fast internal-only pass.
- The CSV parser only reads the first 7 columns (`url;parent;base;result;warning;info;valid`) and ignores the rest. If linkchecker changes its column order, update `COLUMNS` in the script.

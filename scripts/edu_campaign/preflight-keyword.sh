#!/usr/bin/env bash
#
# Pre-flight gate for the generate-article pipeline.
#
# Between 2026-04-06 and 2026-08-05 the pipeline produced ten articles on
# "docs site search optimization", seven of which resolved to the identical
# filename. Each run checked for duplicates against merged content only, so
# every run correctly concluded it was the first on that keyword while nine
# siblings sat unmerged in the PR queue.
#
# This script makes that check mechanical and blocking. Run it BEFORE the
# research step (which is the expensive part) and again once a slug is known.
#
# Usage:
#   preflight-keyword.sh --keyword "<keyword>"
#   preflight-keyword.sh --keyword "<keyword>" --slug "<slug>"
#
# Exit codes:
#   0  clear to proceed
#   1  blocked: existing coverage or a slug collision. Do not continue.
#   2  usage error, or a dependency is missing.

set -euo pipefail

KEYWORD=""
SLUG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keyword) KEYWORD="${2:-}"; shift 2 ;;
    --slug)    SLUG="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$KEYWORD" ]] || { echo "error: --keyword is required" >&2; exit 2; }

for dep in git gh jq; do
  command -v "$dep" >/dev/null 2>&1 || { echo "error: '$dep' is required but not on PATH" >&2; exit 2; }
done

BLOG_DIR="src/content/blog/technical"
BLOCKED=0

note()  { printf '  %s\n' "$1"; }
block() { printf '\n  BLOCKED: %s\n' "$1"; BLOCKED=1; }

git fetch -q origin main

echo
echo "Pre-flight for keyword: '$KEYWORD'"
echo

# --- Check A: already-published articles on this keyword -------------------
# Match the keyword against title and description, not the whole body: a
# passing mention in body text is normal and is not evidence of duplication.
echo "A. Published articles matching the keyword (origin/main)"
PUBLISHED=0
while IFS= read -r path; do
  [[ -n "$path" ]] || continue
  frontmatter="$(git show "origin/main:$path" 2>/dev/null | sed -n '1,12p' || true)"
  if grep -qi -- "$KEYWORD" <<<"$frontmatter"; then
    note "$(basename "$path")"
    PUBLISHED=$((PUBLISHED + 1))
  fi
done < <(git ls-tree -r --name-only origin/main -- "$BLOG_DIR" | grep '\.mdx$' || true)

if [[ $PUBLISHED -eq 0 ]]; then
  note "none"
else
  note "count: $PUBLISHED"
fi
if [[ $PUBLISHED -ge 2 ]]; then
  block "$PUBLISHED articles are already published on this keyword. Two is the cap; the keyword is exhausted. Retire it from keywords.txt, or pick a distinct long-tail angle and record that angle in the PR body."
fi

# --- Check B: unmerged work on this keyword -------------------------------
# This is the check whose absence caused the pileup. The pipeline records
# "Keyword: <keyword>" in every PR body, so the PR queue is authoritative
# about in-flight work in a way the merged tree is not.
echo
echo "B. Existing PRs recording this keyword (any state)"
PR_JSON="$(gh pr list --state all --limit 300 \
  --search "\"Keyword: $KEYWORD\" in:body" \
  --json number,state,title 2>/dev/null || echo '[]')"

PR_COUNT="$(jq 'length' <<<"$PR_JSON")"
OPEN_COUNT="$(jq '[.[] | select(.state == "OPEN")] | length' <<<"$PR_JSON")"

if [[ "$PR_COUNT" -eq 0 ]]; then
  note "none"
else
  jq -r '.[] | "  #\(.number) \(.state): \(.title)"' <<<"$PR_JSON"
fi

if [[ "$OPEN_COUNT" -gt 0 ]]; then
  block "$OPEN_COUNT open PR(s) already cover this keyword. Review or close them before generating another. If your angle is genuinely distinct, state how in the PR body and name the different long-tail keyword you are targeting."
fi

# --- Check C: slug collision on main -------------------------------------
if [[ -n "$SLUG" ]]; then
  echo
  echo "C. Slug availability: $SLUG.mdx"
  if git cat-file -e "origin/main:$BLOG_DIR/$SLUG.mdx" 2>/dev/null; then
    block "$BLOG_DIR/$SLUG.mdx already exists on origin/main. Pick a slug that reflects this article's specific angle rather than the bare keyword."
  else
    note "available on origin/main"
  fi

  # --- Check D: slug claimed by an open PR -------------------------------
  # Seven PRs each passed a main-only check and still collided, because they
  # collided with each other rather than with anything merged.
  echo
  echo "D. Slug claimed by an open PR"
  CLAIMED="$(gh pr list --state open --limit 300 --json number,title,files 2>/dev/null \
    | jq -r --arg p "$BLOG_DIR/$SLUG.mdx" \
        '.[] | select(any(.files[]?; .path == $p)) | "  #\(.number): \(.title)"' || true)"
  if [[ -n "$CLAIMED" ]]; then
    printf '%s\n' "$CLAIMED"
    block "an open PR already writes to $BLOG_DIR/$SLUG.mdx. Two PRs adding the same path will conflict with each other even though both merge cleanly against main today."
  else
    note "not claimed"
  fi
else
  echo
  echo "C/D. Slug checks skipped (no --slug given)"
  note "re-run with --slug once the title is settled, before creating the branch"
fi

echo
if [[ $BLOCKED -eq 1 ]]; then
  echo "RESULT: blocked. Do not proceed to research or article generation."
  echo "Resolve the items above, or pick a different keyword, then re-run."
  exit 1
fi

echo "RESULT: clear to proceed."
exit 0

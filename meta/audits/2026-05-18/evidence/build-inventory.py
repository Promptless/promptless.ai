#!/usr/bin/env python3
"""
Phase 1 inventory builder — audit 2026-05-18.

DEGRADED MODE: runs without `gray-matter` / `remark-mdx` because node is unavailable
in this audit environment. Frontmatter is parsed by bounded YAML extraction; body
metrics use targeted patterns for known shapes (no general regex over MDX).

Inputs:
  - All *.mdx under src/content/docs/, excluding *internal/*
  - src/lib/generated/sidebar.json (for nav cross-check)
  - git history for ownership/freshness

Outputs:
  - meta/audits/2026-05-18/evidence/inventory.csv
  - meta/audits/2026-05-18/evidence/inventory.json (intermediate, for downstream phases)
"""
import csv
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]  # promptless.ai/  (evidence/audit-date/audits/meta/promptless.ai)
DOCS_ROOT = REPO / "src/content/docs"
SIDEBAR_JSON = REPO / "src/lib/generated/sidebar.json"
OUT_DIR = REPO / "meta/audits/2026-05-18/evidence"
TODAY = datetime(2026, 5, 18, tzinfo=timezone.utc)

# --- Frontmatter parser (bounded YAML; no PyYAML in stdlib) ---------------

def parse_frontmatter(text):
    """Return (frontmatter_dict, body_text).
    Handles the known Starlight shape: title, description, slug,
    sidebar.hidden, sidebar.order. Unknown keys captured verbatim as strings.
    """
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_block = text[4:end]
    body = text[end + 5:]

    fm = {}
    nest_key = None
    for line in fm_block.split("\n"):
        if not line.strip():
            continue
        if not line.startswith(" "):
            # top-level
            nest_key = None
            if ":" in line:
                k, _, v = line.partition(":")
                k = k.strip()
                v = v.strip()
                if v == "":
                    nest_key = k
                    fm[k] = {}
                else:
                    fm[k] = _coerce(v)
        else:
            # nested under last_top
            if nest_key and ":" in line:
                k, _, v = line.partition(":")
                k = k.strip()
                v = v.strip()
                fm[nest_key][k] = _coerce(v)
    return fm, body


def _coerce(v):
    if v.lower() in ("true", "false"):
        return v.lower() == "true"
    if v.lstrip("-").isdigit():
        return int(v)
    # strip surrounding quotes
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    return v

# --- Body metrics ---------------------------------------------------------

# Targeted patterns. Per the plan: no general regex over MDX. These are anchored
# patterns for specific known shapes. Each one is conservative — false negatives
# preferred over false positives.

H2_RE = re.compile(r"^##\s+\S", re.MULTILINE)              # markdown H2 (## Foo)
H1_RE = re.compile(r"^#\s+\S", re.MULTILINE)
FENCED_RE = re.compile(r"```[a-zA-Z0-9_+\-]*\n.*?\n```", re.DOTALL)
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
# Image / Frame components
IMG_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")        # ![alt](src)
FRAME_RE = re.compile(r"<Frame\b[^>]*>", re.IGNORECASE)
IMAGE_COMP_RE = re.compile(r"<Image\b[^>]*>", re.IGNORECASE)
# Astro Image / Frame may include alt= attribute; absence is the flag we care about
ALT_ATTR_RE = re.compile(r'alt\s*=\s*("([^"]*)"|\{[^}]*\}|`[^`]*`)', re.IGNORECASE)


def measure_body(body):
    """Return a dict of body-level metrics."""
    # Strip fenced code blocks before counting prose
    prose = FENCED_RE.sub("", body)
    # Strip MDX/HTML tags conservatively
    prose = re.sub(r"<[^>]+>", " ", prose)
    words = re.findall(r"\b\w[\w'\-]*\b", prose)
    word_count = len(words)

    h2_count = len(H2_RE.findall(body))
    h1_count = len(H1_RE.findall(body))
    code_block_count = len(FENCED_RE.findall(body))
    md_links = MD_LINK_RE.findall(body)
    internal_links = 0
    external_links = 0
    for _, url in md_links:
        # URL extraction is conservative — only obvious external schemes count
        if url.startswith("http://") or url.startswith("https://") or url.startswith("//"):
            external_links += 1
        else:
            internal_links += 1

    md_images = IMG_MD_RE.findall(body)
    frame_count = len(FRAME_RE.findall(body))
    image_comp_count = len(IMAGE_COMP_RE.findall(body))
    image_count = len(md_images) + frame_count + image_comp_count

    # Alt-text presence ratio. For markdown images, alt is the [text] portion;
    # for components, look for alt= attribute on each tag.
    images_with_alt = 0
    images_without_alt = 0
    for alt, _src in md_images:
        if alt.strip():
            images_with_alt += 1
        else:
            images_without_alt += 1
    for tag in FRAME_RE.findall(body) + IMAGE_COMP_RE.findall(body):
        if ALT_ATTR_RE.search(tag):
            images_with_alt += 1
        else:
            images_without_alt += 1

    alt_ratio = None
    if image_count > 0:
        alt_ratio = images_with_alt / image_count

    return dict(
        word_count=word_count,
        h2_count=h2_count,
        h1_count=h1_count,
        code_block_count=code_block_count,
        internal_link_count=internal_links,
        external_link_count=external_links,
        image_count=image_count,
        image_alt_present_ratio=alt_ratio,
    )

# --- Git metadata ---------------------------------------------------------

def git_meta(path):
    """Return ownership + freshness facts for a file."""
    rel = str(path.relative_to(REPO))
    try:
        # Last commit info
        last = subprocess.check_output(
            ["git", "log", "-1", "--format=%H|%ci|%an|%ae", "--", rel],
            cwd=REPO, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if last:
            sha, when, author_name, author_email = last.split("|", 3)
            # git %ci format: "2026-02-23 22:35:08 -0800". Normalize to ISO with colon in tz.
            iso = when.replace(" ", "T", 1)
            # Add colon in timezone offset if missing: -0800 -> -08:00
            iso = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", iso)
            iso = iso.replace(" ", "")
            when_dt = datetime.fromisoformat(iso)
            age_days = (TODAY - when_dt).days
        else:
            sha, when, author_name, author_email, age_days = "", "", "", "", None

        # Distinct committers
        committers = subprocess.check_output(
            ["git", "log", "--format=%ae", "--", rel],
            cwd=REPO, text=True, stderr=subprocess.DEVNULL,
        ).strip().splitlines()
        distinct = len(set(c.strip() for c in committers if c.strip()))
        total_commits = len(committers)

        return dict(
            last_modified=when,
            last_author=author_name,
            last_author_email=author_email,
            last_sha=sha,
            age_days=age_days,
            distinct_committers_count=distinct,
            total_commits=total_commits,
        )
    except subprocess.CalledProcessError:
        return dict(
            last_modified="",
            last_author="",
            last_author_email="",
            last_sha="",
            age_days=None,
            distinct_committers_count=0,
            total_commits=0,
        )

# --- Sidebar cross-check --------------------------------------------------

def walk_sidebar_slugs(node, out):
    """Recursively collect every slug found in the sidebar tree."""
    if isinstance(node, list):
        for n in node:
            walk_sidebar_slugs(n, out)
    elif isinstance(node, dict):
        if "slug" in node:
            out.add(node["slug"])
        if "items" in node:
            walk_sidebar_slugs(node["items"], out)


def build_inventory():
    rows = []
    paths = sorted(DOCS_ROOT.rglob("*.mdx"))
    paths = [p for p in paths if "internal" not in p.parts]
    for path in paths:
        rel = str(path.relative_to(REPO))
        text = path.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        body_metrics = measure_body(body)
        gm = git_meta(path)
        sidebar = fm.get("sidebar", {}) if isinstance(fm.get("sidebar"), dict) else {}
        rows.append({
            "path": rel,
            "slug": fm.get("slug", ""),
            "title": fm.get("title", ""),
            "description_present": bool(fm.get("description")),
            "sidebar_order": sidebar.get("order"),
            "sidebar_hidden": sidebar.get("hidden", False),
            "is_generated": False,
            **body_metrics,
            **gm,
        })
    return rows


def main():
    rows = build_inventory()

    # Sidebar cross-check
    sidebar = json.loads(SIDEBAR_JSON.read_text())
    sidebar_slugs = set()
    walk_sidebar_slugs(sidebar, sidebar_slugs)

    file_slugs = {r["slug"] for r in rows if r["slug"]}
    orphans = sorted(s for s in file_slugs if s not in sidebar_slugs)
    ghosts = sorted(s for s in sidebar_slugs if s not in file_slugs)

    # Inbound link count: count occurrences of each slug elsewhere
    slug_to_inbound = {r["slug"]: 0 for r in rows}
    # Build a flat blob of all bodies so we don't re-read files
    bodies = {}
    for r in rows:
        bodies[r["path"]] = (REPO / r["path"]).read_text()
    for r in rows:
        if not r["slug"]:
            continue
        # Count occurrences of slug-or-its-tail in other bodies
        slug = r["slug"]
        tail = slug.split("/")[-1]
        count = 0
        for other_path, body in bodies.items():
            if other_path == r["path"]:
                continue
            # Only count obvious link forms: ](.../slug or ](/slug or ](slug-like)
            # Conservative: look for the slug as a path component in a markdown link target
            patterns = [
                f"]({slug})",
                f"](/{slug})",
                f"](../{tail})",
                f"](./{tail})",
                f"]({tail})",
                f"](docs/{slug.replace('docs/', '', 1)})" if slug.startswith("docs/") else None,
            ]
            for p in patterns:
                if p and p in body:
                    count += 1
                    break  # one inbound per source page
        slug_to_inbound[slug] = count

    for r in rows:
        r["inbound_link_count"] = slug_to_inbound.get(r["slug"], 0)

    # Write CSV
    out_csv = OUT_DIR / "inventory.csv"
    fieldnames = [
        "path", "slug", "title",
        "description_present", "sidebar_order", "sidebar_hidden",
        "word_count", "h1_count", "h2_count", "code_block_count",
        "internal_link_count", "external_link_count",
        "image_count", "image_alt_present_ratio",
        "inbound_link_count",
        "last_modified", "last_author", "last_author_email", "last_sha",
        "age_days", "distinct_committers_count", "total_commits",
        "is_generated",
    ]
    with open(out_csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            row = {k: r.get(k, "") for k in fieldnames}
            # CSV-friendly booleans + None
            for k, v in list(row.items()):
                if isinstance(v, bool):
                    row[k] = "TRUE" if v else "FALSE"
                elif v is None:
                    row[k] = ""
            w.writerow(row)

    # Write JSON (intermediate, for Phases 9 + 13)
    out_json = OUT_DIR / "inventory.json"
    with open(out_json, "w") as f:
        json.dump({
            "rows": rows,
            "sidebar_orphans_in_tree_not_nav": orphans,
            "sidebar_ghosts_in_nav_not_tree": ghosts,
        }, f, indent=2, default=str)

    # Print summary
    print(f"Inventory: {len(rows)} pages")
    print(f"Orphans (in tree, not nav): {len(orphans)}")
    print(f"Ghosts (in nav, not tree): {len(ghosts)}")
    print(f"Pages without description: {sum(1 for r in rows if not r['description_present'])}")
    print(f"Pages hidden in sidebar: {sum(1 for r in rows if r['sidebar_hidden'])}")
    print(f"Pages >2000 words: {sum(1 for r in rows if r['word_count'] > 2000)}")
    print(f"Pages <100 words: {sum(1 for r in rows if r['word_count'] < 100)}")
    print(f"Pages with images and alt-text ratio < 1.0: "
          f"{sum(1 for r in rows if r['image_count'] > 0 and (r['image_alt_present_ratio'] or 0) < 1.0)}")
    print(f"Median age (days): {sorted([r['age_days'] for r in rows if r['age_days'] is not None])[len(rows)//2]}")
    print(f"Max age (days):    {max(r['age_days'] for r in rows if r['age_days'] is not None)}")

    if orphans:
        print("\nORPHANS (in src/content/docs but not in sidebar.json):")
        for s in orphans:
            print(f"  - {s}")
    if ghosts:
        print("\nGHOSTS (in sidebar.json but no matching MDX):")
        for s in ghosts:
            print(f"  - {s}")


if __name__ == "__main__":
    main()

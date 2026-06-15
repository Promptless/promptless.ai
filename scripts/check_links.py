#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["linkchecker"]
# ///
"""check_links - walk the docs site, rattle every doorknob.

Recursively crawls the given URL without leaving the host. External links
are checked but not followed. Writes timestamped html and csv reports to
tmp/broken-link-reports/.

usage:
    uv run scripts/check_links.py                        # crawl http://localhost:4321
    uv run scripts/check_links.py https://promptless.ai  # crawl production

Or, with linkchecker installed system-wide (`pip install linkchecker`):
    python scripts/check_links.py [url]
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

# linkchecker CSV columns (first 7 are all we care about; the rest are ignored)
COLUMNS = ["url", "parent", "base", "result", "warning", "info", "valid"]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Crawl a site and report broken links via linkchecker.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "url",
        nargs="?",
        default="http://localhost:4321",
        help="root URL to crawl (default: %(default)s)",
    )
    args = parser.parse_args()
    url: str = args.url

    host = urlparse(url).hostname or "unknown"
    stamp = datetime.now().strftime("%Y-%b-%d-%a-%H:%M:%S")
    base = f"broken-link-report_{host}_{stamp}"
    out_dir = Path("tmp/broken-link-reports")
    out_dir.mkdir(parents=True, exist_ok=True)

    html_path = out_dir / f"{base}.html"
    csv_path = out_dir / f"{base}.csv"
    print(f"{url} -> {out_dir}/{base}.{{html,csv}}\n")

    cmd = [
        "linkchecker",
        url,
        "--check-extern",
        "--recursion-level", "-1",
        "--threads", "10",
        "--timeout", "30",
        "--no-robots",
        "-F", f"html/utf-8/{html_path}",
        "-F", f"csv/utf-8/{csv_path}",
    ]
    subprocess.run(cmd, check=False)

    if not csv_path.exists():
        return 0

    rows = parse_csv(csv_path)
    if not rows:
        print("clean.")
        return 0

    bad = [r for r in rows if r["valid"] == "False"]
    warn = [r for r in rows if r["warning"] and r["valid"] == "True"]

    print(f"{len(rows)} checked, {len(bad)} broken, {len(warn)} warnings")

    if bad:
        print("\nbroken:")
        print_table(bad, ["url", "parent", "result"])
    if warn:
        print("\nwarnings:")
        print_table(warn, ["url", "parent", "warning"])

    return 0


def parse_csv(path: Path) -> list[dict[str, str]]:
    """linkchecker CSV is semicolon-delimited with `#`-prefixed comment headers."""
    with path.open(newline="", encoding="utf-8") as f:
        body = [line for line in f if not line.startswith("#")]
    if not "".join(body).strip():
        return []
    reader = csv.reader(body, delimiter=";")
    return [dict(zip(COLUMNS, row)) for row in reader if len(row) >= len(COLUMNS)]


def print_table(rows: list[dict[str, str]], cols: list[str], max_width: int = 80) -> None:
    widths = {
        c: min(max(len(c), max(len(r.get(c, "")) for r in rows)), max_width)
        for c in cols
    }
    fmt = "  ".join(f"{{:<{widths[c]}}}" for c in cols)
    print(fmt.format(*cols))
    print(fmt.format(*("-" * widths[c] for c in cols)))
    for r in rows:
        print(fmt.format(*(truncate(r.get(c, ""), widths[c]) for c in cols)))


def truncate(s: str, width: int) -> str:
    return s if len(s) <= width else s[: width - 1] + "…"


if __name__ == "__main__":
    sys.exit(main())

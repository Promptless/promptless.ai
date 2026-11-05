"""Export the Promptless MCP server's catalog to JSON for the docs.

Reads the tool, skill, and resource definitions from a checkout of
Promptless/promptless and writes what each MCP surface lists: `tools/list`,
`skills/list`, and `resources/list`, as an org member sees them. The output is
the input to `scripts/mcp-reference/generate.ts`, which renders the MCP tools
reference partials.

The definitions are plain Python objects, so importing them needs the runtime's
dependencies but no database, network, credentials, or running server. Run it
with the runtime's Python environment:

    uv run --project <promptless-checkout>/runtime --frozen \
      python scripts/mcp-reference/export-catalog.py --source <promptless-checkout>

The output is deterministic for a given source commit.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "src" / "data" / "mcp" / "catalog.json"


def _source_commit(source: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(source), "rev-parse", "HEAD"], check=True, capture_output=True, text=True
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return result.stdout.strip()


def build_catalog(source: Path) -> dict:
    sys.path.insert(0, str(source))
    from mcp.types import Resource

    from runtime.mcp.profiles import PROFILES
    from runtime.mcp.skills import list_skill_resources, list_skills

    tools: dict[str, dict] = {}
    skills: dict[str, dict] = {}
    resources: dict[str, dict] = {}
    surfaces = []
    for profile in PROFILES:
        for mounted in profile.tools:
            definition = mounted.definition.model_dump(by_alias=True, mode="json", exclude_none=True)
            # Mirrors MountedTool.serves(): a members-only tool is hidden from the
            # bearer of an agent-created organization nobody has claimed yet.
            definition["x-promptless-members-only"] = mounted.members_only
            _add_once(tools, mounted.name, definition)
        profile_skills = list_skills(profile.skill_names)
        for skill in profile_skills:
            _add_once(skills, skill["uri"], skill)
        profile_resources = list_skill_resources(profile.skill_names)
        for resource in profile_resources:
            listed = Resource(
                uri=resource.uri, name=resource.name, mime_type=resource.mime_type, description=resource.description
            ).model_dump(by_alias=True, mode="json", exclude_none=True)
            _add_once(resources, resource.uri, listed)
        surfaces.append(
            {
                "key": profile.key,
                "path": profile.path,
                "name": profile.resource_name,
                # Names and URIs in the order tools/list, skills/list, and resources/list return them.
                "tools": [tool.name for tool in profile.tools],
                "skills": [skill["uri"] for skill in profile_skills],
                "resources": [resource.uri for resource in profile_resources],
            }
        )
    return {
        "source": {"repository": "Promptless/promptless", "commit": _source_commit(source)},
        "surfaces": surfaces,
        "tools": list(tools.values()),
        "skills": list(skills.values()),
        "resources": list(resources.values()),
    }


def _add_once(registry: dict[str, dict], key: str, entry: dict) -> None:
    """Record one catalog entry, refusing two different entries under one key."""

    if key in registry and registry[key] != entry:
        raise SystemExit(f"{key} differs between MCP surfaces; the reference assumes one definition per name.")
    registry.setdefault(key, entry)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, required=True, help="Path to a Promptless/promptless checkout.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Where to write the catalog JSON.")
    args = parser.parse_args()

    catalog = build_catalog(args.source.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()

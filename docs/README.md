# docs/ -- Website Agent Knowledge Base

Documentation for agents (and humans) working on the promptless.ai website.

## Principles

1. **AGENTS.md is the table of contents.** It contains a map of every file in
   this directory. When you add, remove, or rename a file here, update the map
   in AGENTS.md.
2. **Progressive disclosure.** Keep files focused on one topic. Link between
   them rather than duplicating content.
3. **Freshness over completeness.** Delete or update docs that no longer
   reflect reality. Mark speculative content clearly.

## Directory Structure

```
docs/
+-- README.md                  # This file
+-- analytics.md               # PostHog setup, event catalog, tracking gaps
```

## Maintenance Checklist

When making changes to docs/:

- [ ] Update the file map in AGENTS.md
- [ ] Update the directory structure above
- [ ] Remove or update docs that no longer reflect the codebase
- [ ] Keep individual docs under ~300 lines; split if they grow

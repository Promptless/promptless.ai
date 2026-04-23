# Promptless Docs

**https://promptless.ai**

This documentation is written and maintained by [Promptless](https://promptless.ai), with edits and refinements by the Promptless team. Check out the [commit history](../../commits/main) to see Promptless drafting, updating, and refining documentation automatically based on product changes.

**Want Promptless to keep your docs up-to-date?** [Sign up at promptless.ai](https://promptless.ai) to get started.

---

## Building These Docs Locally

This site is built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Local Development

From the repository root, run:

```bash
npm install
npm run dev
```

This starts the Astro dev server at `http://localhost:4321` with hot-reloading.

### npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the site for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run Astro type checking |
| `npm run test:smoke` | Run smoke tests |
| `npm run check` | Run typecheck and build |

### Free Tools Local Env

The Broken Link Report form reads these optional public env vars at build/dev time:

```bash
PUBLIC_FREE_TOOLS_API_BASE_URL=http://127.0.0.1:5000
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

If `PUBLIC_FREE_TOOLS_API_BASE_URL` is unset, local dev defaults to `http://127.0.0.1:5000` and production defaults to `https://api.gopromptless.ai`.

---

## Claude Code Skills and Commands

This repository includes several [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills and commands for automating documentation and content tasks.

### Commands

| Command | Description |
|---------|-------------|
| `/docs-audit [hint]` | Audit documentation for AI agent readiness. Produces a prioritized fix list based on [agent-friendly docs best practices](https://www.promptless.ai/blog/technical/agent-docs). |

### Skills

| Skill | Description |
|-------|-------------|
| `generate-article` | Generate blog articles for the edu campaign. Researches a keyword, writes an MDX draft, and opens a PR. |
| `launch-post` | Triage changelog entries and write focused launch articles for features that meet the bar. |
| `agent-docs` | Reference guide for evaluating and improving docs for AI agent consumption. |
| `agent-slack` | Send messages to Slack channels. |

### Enabled Plugins

- `doc-detective` - Automated documentation testing
- `frontend-design` - Frontend design assistance
- `skill-creator` - Create new Claude Code skills

---

## Deployment

- Production and preview deployments are handled by Vercel Git integration.
- Redirects are generated in `vercel.json`.

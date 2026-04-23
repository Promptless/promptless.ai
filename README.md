# Promptless Docs

**https://promptless.ai**

This documentation is written and maintained by [Promptless](https://promptless.ai), with edits and refinements by the Promptless team. Check out the [commit history](../../commits/main) to see Promptless drafting, updating, and refining documentation automatically based on product changes.

**Want Promptless to keep your docs up-to-date?** [Sign up at promptless.ai](https://promptless.ai) to get started.

---

## Building These Docs Locally

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Local Development

From the repository root, run:

```bash
npm install
npm run migrate
npm run dev
```

This starts Astro/Starlight at `http://localhost:4321` with hot-reloading.

### Useful Commands

```bash
npm run migrate:dry      # route/content migration dry run
npm run migrate          # regenerate manifests, redirects, and content
npm run validate:links   # internal link validation against route + redirect manifests
npm run check:route-parity
npm run check            # typecheck + build + link validation + parity check
```

### Free Tools Local Env

The Broken Link Report form reads these optional public env vars at build/dev time:

```bash
PUBLIC_FREE_TOOLS_API_BASE_URL=http://127.0.0.1:5000
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

If `PUBLIC_FREE_TOOLS_API_BASE_URL` is unset, local dev defaults to `http://127.0.0.1:5000` and production defaults to `https://api.gopromptless.ai`.

### Deployment

- Production and preview deployments are handled by Vercel Git integration.
- Redirects are generated into `vercel.json` by the migration script.

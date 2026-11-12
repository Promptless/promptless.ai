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

### AI Tells Bingo leaderboard

`/bingo-leaderboard` shows provisional scores from email-verified saved Bingo boards. It ranks completed lines first, then AI Tells found, with shared ranks for equal scores. Photos still require organizer review. Local-only play and pending uploads do not appear.

The public `/bingo-leaderboard.json` endpoint uses the existing server-only `BINGO_API_BASE_URL` and `BINGO_PROXY_SECRET`. It calls only the runtime's `/bingo/leaderboard` projection, validates the response, and exposes anonymous aliases and scores. It forwards no player cookies and publishes no emails, board IDs, or photos. Players can find their alias beside the saved status on `/bingo`.

Deploy the companion runtime endpoint before this website change. Missing configuration, an older backend, and read failures produce an unavailable state rather than an empty table. Successful responses have a 30-second edge cache; the page refreshes about once a minute and labels a retained snapshot when an update fails.

For local verification, run an unconfigured Astro server at `127.0.0.1:4392`. `tests/bingo/leaderboard-browser.mjs` intercepts the standings response with synthetic fixtures and checks desktop/mobile layouts, accessibility, and empty/error states. Set `BINGO_ARTIFACT_DIR` outside the checkout for screenshots. Run `npm run test:bingo`, `npm run check`, and `npm run test:smoke` for the automated checks. No production credentials or participant data are required.

### Agent Score local development

Agent Score (`/agent-score`, `/agent-score/<host>[/<path>]`) calls the same API base. The score pages render on demand, so they need data from an API even in dev. Without the real backend, run the bundled mock in a second terminal:

```bash
npm run dev:agent-score-mock   # mock API on http://127.0.0.1:5000 (fixtures in src/lib/agent-score/fixtures/)
npm run dev                    # then open http://localhost:4321/agent-score/docs.promptless.ai
```

The mock serves `docs.promptless.ai` (3 scans with changes) and `docs.acme-api.dev` (one low-scoring scan), simulates a scan of any other URL over about 10 seconds, and keeps new results in memory until it restarts. Scan a hostname containing `unreachable`, `ratelimit`, or `private` to see the error states, set `AGENT_SCORE_MOCK_EMPTY_LEADERBOARD=1` for the empty leaderboard, and `AGENT_SCORE_MOCK_SCAN_SECONDS` to change the scan length. The contract types live in `src/lib/agent-score/types.ts`.

### Deployment

- Production and preview deployments are handled by Vercel Git integration.
- Redirects are generated into `vercel.json` by the migration script.

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

### Agent Score local development

Agent Score (`/agent-score`, `/agent-score/<host>[/<path>]`) calls the same API base. The score pages render on demand, so they need data from an API even in dev. Without the real backend, run the bundled mock in a second terminal:

```bash
npm run dev:agent-score-mock   # mock API on http://127.0.0.1:5000 (fixtures in src/lib/agent-score/fixtures/)
npm run dev                    # then open http://localhost:4321/agent-score/docs.promptless.ai
```

The mock serves `docs.promptless.ai` (3 scans with changes) and `docs.acme-api.dev` (one low-scoring scan), simulates a scan of any other URL over about 10 seconds, and keeps new results in memory until it restarts. Scan a hostname containing `unreachable`, `ratelimit`, or `private` to see the error states, set `AGENT_SCORE_MOCK_EMPTY_LEADERBOARD=1` for the empty leaderboard, and `AGENT_SCORE_MOCK_SCAN_SECONDS` to change the scan length. The contract types live in `src/lib/agent-score/types.ts`.

### DoGBench book requests

`/request-book` is a native page that sends requests to the existing Formspark
Contact form (`roBOd2Oxb`). Open the [private submissions inbox](https://dashboard.formspark.io/workspaces/sd9lLcQnV/forms/roBOd2Oxb/submissions)
and search for `dogbench_book_request`. The existing team notifications and
`website-signups` Slack integration receive these requests too. No autoresponder
is configured. Check the Spam view when looking for a missing submission.

The form collects name, email, optional company, and physical-copy preference.
Shipping details are deferred to follow-up; submitting does not subscribe anyone
to marketing. Contact details are not sent to site analytics or browser storage.
Formspark's existing automatic filter and a built-in honeypot handle spam;
rate-limit responses show a one-minute retry message. The native POST fallback
returns to `/request-book/thanks` when JavaScript is unavailable.

Run `npm run test:book-request` for payload, validation, and failure handling tests
(also included in `npm run check`). End-to-end checks must use clearly labeled
synthetic data and a reserved address such as `example.com`; do not fulfill test
requests or permanently delete submissions without approval. The cover image is
the first page of the existing DoGBench field guide PDF from the DoGBench site's
`site/field-guide/dogbench-field-guide.pdf`.

### Deployment

- Production and preview deployments are handled by Vercel Git integration.
- Redirects are generated into `vercel.json` by the migration script.

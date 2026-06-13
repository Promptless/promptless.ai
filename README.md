# Promptless Docs

**https://promptless.ai**

This documentation is written and maintained by [Promptless](https://promptless.ai), with edits and refinements by the Promptless team. Check out the [commit history](../../commits/main) to see Promptless drafting, updating, and refining documentation automatically based on product changes.

**Want Promptless to keep your docs up-to-date?** [Sign up at promptless.ai](https://promptless.ai) to get started.

---

## Repository Structure

This is an [Astro](https://astro.build) site using [Starlight](https://starlight.astro.build) for documentation, deployed to Vercel.

```
src/
├── pages/              # Astro page routes (index, demo, pricing, jobs, blog/, changelog/, free-tools/)
├── components/
│   ├── site/           # Marketing page components (Hero, DemoBooking, PricingCards, VideoEmbed)
│   ├── starlight/      # Starlight component overrides (Header, Footer, Sidebar)
│   └── shared/         # Cross-cutting components (AnalyticsClickTracker, AnnouncementBanner)
├── content/
│   ├── docs/           # Starlight documentation content (MDX)
│   ├── blog/           # Blog posts (MDX)
│   ├── changelog/      # Changelog entries (MDX)
│   ├── website/        # Marketing page content (MDX)
│   └── legal/          # Privacy policy, terms of service
├── lib/                # Shared utilities (navigation, route manifest, content ordering)
└── styles/             # Global CSS

docs/                   # Internal meta-docs (not published to the site)
├── analytics.md        # PostHog setup and event catalog
└── content_strategy/   # Audience, persona, journey, and IA strategy artifacts

scripts/                # Build and migration scripts
tests/smoke/            # Smoke tests
```

### Content Organization

- **Documentation** (`src/content/docs/`): Product docs served at `/docs`, organized by topic (getting-started, core-concepts, integrations, security, etc.)
- **Blog** (`src/content/blog/`): Blog posts served at `/blog`
- **Changelog** (`src/content/changelog/`): Product changelog entries served at `/changelog`
- **Marketing pages** (`src/content/website/`): Landing page content
- **Legal** (`src/content/legal/`): Privacy policy and terms

### Key Configuration Files

- `astro.config.mjs`: Astro config, redirects, Starlight setup
- `vercel.json`: Vercel deploy config and generated redirects
- `src/lib/generated/sidebar.json`: Auto-generated sidebar navigation
- `src/lib/generated/redirects.json`: Route redirects from migration scripts

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

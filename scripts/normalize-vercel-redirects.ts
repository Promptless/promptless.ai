/**
 * Make every generated redirect match its source with or without a trailing slash.
 *
 * Runs after `astro build` and rewrites the redirect routes the Vercel adapter
 * wrote to `.vercel/output/config.json`; src/lib/vercel-redirect-routes.ts
 * explains why. The redirect destinations remain sourced exclusively from
 * astro.config.mjs and src/lib/generated/redirects.json; this script changes
 * only how the generated source regex matches, plus the trailing slash on the
 * dynamic /api destination.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeRedirectRoutes, type VercelRoute } from '../src/lib/vercel-redirect-routes';

// Mirrors the adapter condition in astro.config.mjs: without the adapter, the
// build writes Astro's redirect stub pages to dist/ instead of Vercel routes.
if (process.env.MCP_ENABLED === 'false' && !process.env.ANTHROPIC_API_KEY) {
  process.exit(0);
}

const configPath = path.join(process.cwd(), '.vercel', 'output', 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8')) as { routes?: VercelRoute[] };

// No redirect routes means the adapter changed its output format, and the
// trailing-slash forms would quietly 404 again.
if (normalizeRedirectRoutes(config.routes ?? []) === 0) {
  throw new Error(`Found no redirect routes to normalize in ${configPath}.`);
}

await writeFile(configPath, `${JSON.stringify(config, null, '\t')}\n`);

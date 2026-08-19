/**
 * Preserve the trailing-slash forms of the legacy /api routes on Vercel.
 *
 * Astro correctly turns the configured `/api/[...slug]` redirect into a Vercel
 * catch-all, but @astrojs/vercel currently serializes redirect regexes without
 * Astro's default optional trailing slash. The old API reference published
 * trailing-slash URLs, so make only those generated rules slash-tolerant after
 * the adapter writes `.vercel/output/config.json`.
 *
 * The redirect destinations remain sourced exclusively from astro.config.mjs;
 * this script changes only how the adapter's generated source regex matches.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

if (process.env.MCP_ENABLED === 'false') {
  process.exit(0);
}

const configPath = path.join(process.cwd(), '.vercel', 'output', 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8')) as {
  routes?: Array<{
    src?: string;
    headers?: Record<string, string>;
  }>;
};

let patchedRules = 0;

for (const route of config.routes ?? []) {
  const location = route.headers?.Location;
  if (!route.src || !location?.startsWith('/docs/for-docs/api/')) continue;

  if (route.src === '^/api$' || route.src === '^/api/?$') {
    route.src = '^/api/?$';
    patchedRules += 1;
    continue;
  }

  if (route.src.startsWith('^/api(?:') && route.src.endsWith('$')) {
    if (!route.src.endsWith('/?$')) {
      route.src = `${route.src.slice(0, -1)}/?$`;
    }
    // Starlight's generated OpenAPI pages declare slash-terminated canonicals.
    // The adapter also removes this trailing slash from dynamic destinations.
    if (!location.endsWith('/')) {
      route.headers!.Location = `${location}/`;
    }
    patchedRules += 1;
  }
}

if (patchedRules !== 2) {
  throw new Error(
    `Expected to normalize exactly two generated /api redirects, normalized ${patchedRules}.`
  );
}

await writeFile(configPath, `${JSON.stringify(config, null, '\t')}\n`);

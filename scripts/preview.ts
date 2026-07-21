/**
 * `npm run preview` — serve the last production build locally.
 *
 * `astro preview` is not supported once the @astrojs/vercel adapter is active
 * (the MCP route needs it; see docs/starport-migration/adrs/0007-docs-mcp-server.md),
 * so this reuses the smoke-test static server, which serves the newest build
 * output (`.vercel/output/static` with its config.json redirects, or `dist`).
 * Note: the /mcp function is not executed here — use `npm run dev` for that.
 */
import { startPreviewServer } from '../tests/smoke/preview-server';

const port = Number(process.env.PORT) || 4321;
const server = await startPreviewServer({ port });
console.log(`Serving the last build at ${server.baseUrl} (Ctrl-C to stop)`);
console.log('Note: /mcp is a serverless function and is not served here; use `npm run dev`.');

process.on('SIGINT', () => {
  void server.close().finally(() => process.exit(0));
});

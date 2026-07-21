/**
 * In-process preview server for the smoke tests.
 *
 * `astro preview` is not supported by @astrojs/vercel (the SSR adapter required
 * by the MCP route), so this serves the built static output directly:
 *   - Adapter builds: `.vercel/output/static`, plus the redirect routes the
 *     adapter emits into `.vercel/output/config.json` (applied as real 3xx
 *     responses, matching what Vercel does in production).
 *   - Static builds (MCP_ENABLED=false): `dist`, where Astro emits
 *     "Redirecting to: …" stub pages instead of platform redirects.
 * The smoke tests accept both behaviors.
 */
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PREVIEW_HOST = '127.0.0.1';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(dirname, '..', '..');

export interface PreviewServer {
  baseUrl: string;
  close: () => Promise<void>;
}

interface RedirectRoute {
  pattern: RegExp;
  location: string;
  status: number;
}

interface BuildOutput {
  staticRoot: string;
  redirects: RedirectRoute[];
}

function loadRedirectRoutes(configPath: string): RedirectRoute[] {
  if (!existsSync(configPath)) return [];
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    routes?: Array<{ src?: string; status?: number; headers?: Record<string, string> }>;
  };
  const redirects: RedirectRoute[] = [];
  for (const route of config.routes ?? []) {
    const location = route.headers?.Location;
    if (!route.src || !location || !route.status || route.status < 300 || route.status >= 400) {
      continue;
    }
    try {
      redirects.push({ pattern: new RegExp(route.src), location, status: route.status });
    } catch {
      // Skip patterns Node's RegExp cannot parse; smoke coverage degrades gracefully.
    }
  }
  return redirects;
}

function mtimeOf(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return -1;
  }
}

function resolveBuildOutput(): BuildOutput {
  const vercelStatic = path.join(ROOT, '.vercel', 'output', 'static');
  const dist = path.join(ROOT, 'dist');
  // Both roots can exist (an adapter build followed by an MCP_ENABLED=false
  // build, or vice versa) — serve whichever was built most recently so the
  // smoke run always tests the current build, not a stale artifact.
  const vercelMtime = mtimeOf(path.join(vercelStatic, 'index.html'));
  const distMtime = mtimeOf(path.join(dist, 'index.html'));
  if (vercelMtime >= 0 && vercelMtime >= distMtime) {
    return {
      staticRoot: vercelStatic,
      redirects: loadRedirectRoutes(path.join(ROOT, '.vercel', 'output', 'config.json')),
    };
  }
  if (distMtime >= 0) {
    return { staticRoot: dist, redirects: [] };
  }
  throw new Error(
    `Missing build output (looked for ${vercelStatic}/index.html and ${dist}/index.html). ` +
      'Run "npm run build" (or "npm run check") before smoke tests.'
  );
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/** Map a request pathname to candidate files inside the static root. */
function candidateFiles(staticRoot: string, pathname: string): string[] {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return []; // malformed percent-encoding → 404, not an unhandled rejection
  }
  const safe = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(staticRoot, safe);
  if (!base.startsWith(staticRoot)) return [];
  // Try both interpretations regardless of a dot in the last segment: a route
  // like /reference/v1.2 is a directory with an index.html, not a file.
  if (path.extname(safe) !== '') return [base, path.join(base, 'index.html')];
  return [path.join(base, 'index.html'), base];
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, PREVIEW_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate a free preview port.')));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

export async function startPreviewServer(options: { port?: number } = {}): Promise<PreviewServer> {
  const { staticRoot, redirects } = resolveBuildOutput();
  const port = options.port ?? (await getFreePort());
  const baseUrl = `http://${PREVIEW_HOST}:${port}`;

  const server: Server = createServer(async (req, res) => {
    const method = req.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const pathname = new URL(req.url ?? '/', baseUrl).pathname;

    for (const redirect of redirects) {
      if (redirect.pattern.test(pathname)) {
        res.writeHead(redirect.status, { Location: redirect.location }).end();
        return;
      }
    }

    for (const candidate of candidateFiles(staticRoot, pathname)) {
      try {
        const body = await readFile(candidate);
        res.writeHead(200, { 'content-type': contentTypeFor(candidate) });
        res.end(method === 'HEAD' ? undefined : body);
        return;
      } catch {
        continue;
      }
    }

    try {
      const notFound = await readFile(path.join(staticRoot, '404.html'));
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(method === 'HEAD' ? undefined : notFound);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, PREVIEW_HOST, resolve);
  });

  return {
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

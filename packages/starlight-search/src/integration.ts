import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { buildCorpus } from './core/build';
import type { ClientConfig, SearchOptions } from './core/types';

export function searchIntegration(options: SearchOptions, siteTitle: string): AstroIntegration {
  let artifactDir: string;
  let base = '/';
  return {
    name: 'starport-search',
    hooks: {
      'astro:config:setup': ({ config, command, updateConfig, injectRoute }) => {
        artifactDir = fileURLToPath(new URL('.starport/search/', config.root));
        base = config.base;
        const dev = command === 'dev';
        const clientConfig: ClientConfig = {
          assistant: options.assistant === true,
          endpoint: `${base.replace(/\/$/, '')}/api/starport/assistant`,
          manifestUrl: `${base.replace(/\/$/, '')}/starport-search/manifest.json`,
          siteTitle, dev,
        };
        updateConfig({ vite: { plugins: [{
          name: 'starport-search:config',
          resolveId(id) { if (id === 'virtual:starport-search' || id === 'virtual:starport-search/server') return '\0' + id; },
          load(id) {
            if (id === '\0virtual:starport-search') return `export default ${JSON.stringify(clientConfig)}`;
            if (id === '\0virtual:starport-search/server') return `export const artifactDir = ${dev ? JSON.stringify(artifactDir) : "process.cwd() + '/.starport/search'"}`;
          },
          configureServer(server) {
            let stale = false;
            server.watcher.on('all', (_event, path) => {
              if (/\/(src|public|openapi)\//.test(path) || /astro\.config\./.test(path)) stale = true;
            });
            server.middlewares.use(async (req, res, next) => {
              if (!req.url?.startsWith(`${base.replace(/\/$/, '')}/starport-search/`)) return next();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              try {
                if (req.url.split('?')[0]?.endsWith('/manifest.json')) {
                  const manifest = JSON.parse(await readFile(`${artifactDir}/manifest.json`, 'utf8'));
                  res.end(JSON.stringify({ ...manifest, stale, index: 'index.json' }));
                } else if (req.url.split('?')[0]?.endsWith('/index.json')) {
                  res.end(await readFile(`${artifactDir}/index.json`, 'utf8'));
                } else { res.statusCode = 404; res.end('{}'); }
              } catch {
                res.statusCode = 503;
                res.end(JSON.stringify({ error: 'Run npm run build to generate the development search index.' }));
              }
            });
          },
        }] } });
        if (clientConfig.assistant) injectRoute({
          pattern: clientConfig.endpoint,
          entrypoint: new URL('./server/route.ts', import.meta.url),
          prerender: false,
        });
      },
      'astro:config:done': ({ config }) => {
        if (options.assistant && !config.adapter) throw new Error('Starport assistant requires a Node adapter. Disable assistant for a static build.');
      },
      'astro:build:generated': async ({ dir, logger }) => {
        const result = await buildCorpus(fileURLToPath(dir), artifactDir, options, base);
        logger.info(`Search: ${result.pages} pages, ${result.sections} sections, ${(result.bytes / 1024).toFixed(0)} KiB before compression.`);
      },
    },
  };
}

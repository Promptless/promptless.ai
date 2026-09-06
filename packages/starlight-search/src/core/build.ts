import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { extractPage } from './extract';
import { createIndex } from './search';
import type { Page, SearchArtifact, SearchOptions } from './types';

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? htmlFiles(join(dir, entry.name)) : entry.name.endsWith('.html') ? [join(dir, entry.name)] : []));
  return nested.flat().sort();
}

export async function buildCorpus(outDir: string, artifactDir: string, options: SearchOptions, base = '/') {
  const pages: Page[] = [];
  for (const file of await htmlFiles(outDir)) {
    const route = relative(outDir, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
    const page = extractPage(await readFile(file, 'utf8'), `${base.replace(/\/$/, '')}/${route}`, options);
    if (page) pages.push(page);
  }
  if (!pages.length) throw new Error('Starport search found no eligible main content in the rendered site.');
  const { engine, ranking } = createIndex(pages, options.ranking);
  const artifact: SearchArtifact = { version: 2, generatedAt: new Date().toISOString(), ranking, index: engine.toJSON() };
  const serialized = JSON.stringify(artifact);
  const hash = createHash('sha256').update(serialized).digest('hex').slice(0, 16);
  const publicDir = join(outDir, 'starport-search');
  await mkdir(artifactDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(artifactDir, 'index.json'), serialized);
  await writeFile(join(artifactDir, 'pages.json'), JSON.stringify({ version: 1, pages }));
  await writeFile(join(publicDir, `index-${hash}.json`), serialized);
  const manifest = { version: 1, index: `index-${hash}.json`, generatedAt: artifact.generatedAt };
  await writeFile(join(publicDir, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(join(artifactDir, 'manifest.json'), JSON.stringify(manifest));
  return { pages: pages.length, sections: artifact.index.documentCount, bytes: Buffer.byteLength(serialized) };
}

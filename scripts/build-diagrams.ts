import { execFileSync } from 'child_process';
import { readFileSync, readdirSync, mkdirSync } from 'fs';
import { join, basename, resolve } from 'path';

const DIAGRAMS_DIR = resolve('src/diagrams');
const OUTPUT_DIR = resolve('public/mermaid');
const MMDC = resolve('node_modules/.bin/mmdc');

mkdirSync(OUTPUT_DIR, { recursive: true });

const files = readdirSync(DIAGRAMS_DIR).filter(f => f.endsWith('.mmd'));

if (files.length === 0) {
  console.log('No .mmd files found in src/diagrams/');
  process.exit(0);
}

for (const file of files) {
  const srcPath = join(DIAGRAMS_DIR, file);
  const baseName = basename(file, '.mmd');
  const outPath = join(OUTPUT_DIR, `${baseName}.svg`);
  const content = readFileSync(srcPath, 'utf-8');

  const width = content.match(/^%% mmdc-width:\s*(\d+)/m)?.[1] ?? '800';
  const height = content.match(/^%% mmdc-height:\s*(\d+)/m)?.[1] ?? '600';

  console.log(`  ${file} → ${baseName}.svg  (width=${width})`);
  execFileSync(MMDC, ['-i', srcPath, '-o', outPath, '--width', width, '--height', height], {
    stdio: 'inherit',
  });
}

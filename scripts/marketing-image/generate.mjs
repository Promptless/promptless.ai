#!/usr/bin/env node
/**
 * Generate a Linear-style marketing composite: a headline + Promptless logo on
 * a dark gradient, with a product screenshot floated on the right.
 *
 * Lightweight pipeline — no browser:
 *   build an SVG  ->  rasterize with @resvg/resvg-js (using vendored Inter
 *   TTFs)  ->  downscale to the exact target size with sharp  ->  compress
 *   under the size cap.
 *
 * Usage:
 *   npm run marketing:image -- \
 *     --headline "Keep your docs|in sync, automatically" \
 *     --screenshot public/assets/promptless_1_review.png \
 *     --out public/assets/marketing/docs-in-sync.png
 *
 * Options (defaults in []):
 *   --headline    Headline text. Use "|" or "\n" for line breaks. (required)
 *   --screenshot  Product screenshot to embed. (required)
 *   --out         Output PNG path. (required)
 *   --eyebrow     Small accent label above the headline.
 *   --logo        Logo file [public/assets/logo_darkbg.svg]
 *   --width       Canvas width  [1366]
 *   --height      Canvas height [768]
 *   --max-kb      Max output size in KB [1024]
 *   --scale       Supersampling factor for crispness [2]
 *   --bg-from     Gradient start color [#0b0d12]
 *   --bg-to       Gradient end color   [#1b1e27]
 *   --fg          Headline color       [#ffffff]
 *   --accent      Eyebrow color        [#8ea2ff]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const fontsDir = path.join(__dirname, 'fonts');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveRepoPath(p) {
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

/** Rasterize any image (incl. SVG logos) to a PNG data URI at a target height. */
async function imageToPngDataUri(filePath, targetHeightPx) {
  let pipeline = sharp(resolveRepoPath(filePath), { density: 384 });
  if (targetHeightPx) pipeline = pipeline.resize({ height: Math.round(targetHeightPx) });
  const buf = await pipeline.png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function compressUnder(rawPng, width, height, maxBytes) {
  let out = await sharp(rawPng).resize(width, height, { fit: 'fill' }).png({ compressionLevel: 9 }).toBuffer();
  if (out.length <= maxBytes) return { buffer: out, note: 'png' };

  for (const colors of [256, 128, 64, 32]) {
    out = await sharp(rawPng)
      .resize(width, height, { fit: 'fill' })
      .png({ compressionLevel: 9, palette: true, colors, effort: 10 })
      .toBuffer();
    if (out.length <= maxBytes) return { buffer: out, note: `png palette ${colors}` };
  }

  for (const quality of [92, 85, 78]) {
    out = await sharp(rawPng).resize(width, height, { fit: 'fill' }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= maxBytes) return { buffer: out, note: `jpeg q${quality}`, jpeg: true };
  }
  return { buffer: out, note: 'jpeg q78 (still over cap)', jpeg: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const missing = ['headline', 'screenshot', 'out'].filter((k) => !args[k] || args[k] === true);
  if (missing.length) {
    console.error(`Missing required option(s): ${missing.map((m) => `--${m}`).join(', ')}`);
    console.error('See the header of scripts/marketing-image/generate.mjs for usage.');
    process.exit(1);
  }

  const W = parseInt(args.width, 10) || 1366;
  const H = parseInt(args.height, 10) || 768;
  const scale = parseInt(args.scale, 10) || 2;
  const maxBytes = (parseInt(args['max-kb'], 10) || 1024) * 1024;
  const bgFrom = args['bg-from'] || '#0b0d12';
  const bgTo = args['bg-to'] || '#1b1e27';
  const fg = args.fg || '#ffffff';
  const accent = args.accent || '#8ea2ff';
  const logoPath = args.logo || 'public/assets/logo_darkbg.svg';
  const eyebrow = args.eyebrow && args.eyebrow !== true ? String(args.eyebrow) : null;

  // --- Layout geometry (logical px) ---
  const padX = 88;
  const logoH = 44;
  const logoBottom = 84;
  const shotLeft = Math.round(W * 0.49);
  const shotRightBleed = 44;
  const shotBoxW = W - shotLeft + shotRightBleed;
  const radius = 16;

  // --- Assets ---
  const shotMeta = await sharp(resolveRepoPath(args.screenshot)).metadata();
  const shotAspect = shotMeta.width / shotMeta.height;
  const shotBoxH = Math.round(shotBoxW / shotAspect);
  const shotY = Math.round((H - shotBoxH) / 2);

  const logoMeta = await sharp(resolveRepoPath(logoPath), { density: 384 }).metadata();
  const logoW = Math.round(logoH * (logoMeta.width / logoMeta.height));
  const logoY = H - logoBottom - logoH;

  const [shotData, logoData, ...fontBuffers] = await Promise.all([
    imageToPngDataUri(args.screenshot, shotBoxH * scale),
    imageToPngDataUri(logoPath, logoH * scale),
    readFile(path.join(fontsDir, 'Inter-Regular.ttf')),
    readFile(path.join(fontsDir, 'Inter-SemiBold.ttf')),
    readFile(path.join(fontsDir, 'Inter-Bold.ttf')),
  ]);

  // --- Text layout (we control breaks via "|"/"\n", so no auto-wrap needed) ---
  const eyebrowSize = 22;
  const headlineSize = 60;
  const headlineLineStep = Math.round(headlineSize * 1.06);
  const lines = String(args.headline).split(/\\n|\|/).map((l) => l.trim());

  let cursorY = 100;
  const textNodes = [];
  if (eyebrow) {
    const baseline = cursorY + Math.round(eyebrowSize * 0.8);
    textNodes.push(
      `<text x="${padX}" y="${baseline}" font-family="Inter" font-weight="600" font-size="${eyebrowSize}" letter-spacing="0.2" fill="${accent}">${escapeXml(eyebrow)}</text>`,
    );
    cursorY = baseline + Math.round(eyebrowSize * 0.4) + 22;
  }
  let baseline = cursorY + Math.round(headlineSize * 0.8);
  for (const line of lines) {
    textNodes.push(
      `<text x="${padX}" y="${baseline}" font-family="Inter" font-weight="600" font-size="${headlineSize}" letter-spacing="-1.3" fill="${fg}">${escapeXml(line)}</text>`,
    );
    baseline += headlineLineStep;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgFrom}"/>
      <stop offset="1" stop-color="${bgTo}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0.8" y1="0" x2="0.4" y2="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="shotClip">
      <rect x="${shotLeft}" y="${shotY}" width="${shotBoxW}" height="${shotBoxH}" rx="${radius}" ry="${radius}"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#sheen)"/>

  <g clip-path="url(#shotClip)">
    <image href="${shotData}" x="${shotLeft}" y="${shotY}" width="${shotBoxW}" height="${shotBoxH}" preserveAspectRatio="xMidYMid slice"/>
  </g>
  <rect x="${shotLeft}" y="${shotY}" width="${shotBoxW}" height="${shotBoxH}" rx="${radius}" ry="${radius}"
        fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="1"/>

  ${textNodes.join('\n  ')}

  <image href="${logoData}" x="${padX}" y="${logoY}" width="${logoW}" height="${logoH}"/>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W * scale },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });
  const rawPng = resvg.render().asPng();

  const { buffer, note, jpeg } = await compressUnder(rawPng, W, H, maxBytes);

  let outPath = resolveRepoPath(args.out);
  if (jpeg && /\.png$/i.test(outPath)) outPath = outPath.replace(/\.png$/i, '.jpg');
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, buffer);

  const meta = await sharp(buffer).metadata();
  console.log(`✓ ${path.relative(repoRoot, outPath)}`);
  console.log(`  ${meta.width}x${meta.height}px · ${(buffer.length / 1024).toFixed(0)} KB · ${note}`);
  if (buffer.length > maxBytes) {
    console.warn(`  ⚠ exceeds ${(maxBytes / 1024).toFixed(0)} KB cap`);
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

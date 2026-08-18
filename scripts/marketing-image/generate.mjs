#!/usr/bin/env node
/**
 * Generate a Linear-style marketing composite: a headline + Promptless logo on
 * a dark gradient, with a product screenshot floated on the right.
 *
 * Lightweight pipeline — no browser:
 *   Satori lays out a flexbox tree -> SVG (text as vector paths)
 *   -> @resvg/resvg-js rasterizes -> sharp downscales to the exact size and
 *   compresses under the cap.
 *
 * Satori gives us a real flex layout engine, so the headline wraps inside its
 * column automatically — no manual text measurement or baseline math.
 *
 * Usage:
 *   npm run marketing:image -- \
 *     --headline "Keep your docs|in sync, automatically" \
 *     --screenshot public/assets/promptless_1_review.png \
 *     --out public/assets/marketing/docs-in-sync.png
 *
 * Options (defaults in []):
 *   --headline    Headline text. Use "|" or "\n" for hard line breaks. (required)
 *   --screenshot  Product screenshot to embed. (required)
 *   --out         Output PNG path. (required)
 *   --eyebrow     Small accent label above the headline.
 *   --logo        Logo file [public/assets/logo_darkbg.svg]
 *   --width       Canvas width  [1366]
 *   --height      Canvas height [768]
 *   --max-kb      Max output size in KB [1024]
 *   --scale       Supersampling factor for crispness [2]
 *   --bg-top      Gradient color at the top    [#15171d] (almost black)
 *   --bg-bottom   Gradient color at the bottom [#000000] (pure black)
 *   --fg          Headline color               [#ffffff]
 *   --accent      Eyebrow color                [#8ea2ff]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
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
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else args[key] = next, i++;
  }
  return args;
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

// Tiny element helpers so the layout below reads like JSX.
// Satori wants `src`/`width`/`height` as element props (not style) on <img>.
const box = (style, children) => ({ type: 'div', props: { style, ...(children !== undefined ? { children } : {}) } });
const img = (src, width, height, style) => ({ type: 'img', props: { src, width, height, style } });

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
  const bgTop = args['bg-top'] || '#15171d';
  const bgBottom = args['bg-bottom'] || '#000000';
  const fg = args.fg || '#ffffff';
  const accent = args.accent || '#8ea2ff';
  const logoPath = args.logo || 'public/assets/logo_darkbg.svg';
  const eyebrow = args.eyebrow && args.eyebrow !== true ? String(args.eyebrow) : null;

  // --- Geometry (logical px) ---
  const padX = 88;
  const logoH = 44;
  const logoBottom = 84;
  const shotLeft = Math.round(W * 0.49);
  const shotBleed = 44;
  const shotBoxW = W - shotLeft + shotBleed;
  const textColW = shotLeft - 48 - padX; // left column, kept clear of the screenshot
  const radius = 16;
  const headlineSize = 60;

  // --- Assets ---
  const shotMeta = await sharp(resolveRepoPath(args.screenshot)).metadata();
  const shotBoxH = Math.round(shotBoxW / (shotMeta.width / shotMeta.height));
  const logoMeta = await sharp(resolveRepoPath(logoPath), { density: 384 }).metadata();
  const logoW = Math.round(logoH * (logoMeta.width / logoMeta.height));

  const [shotData, logoData, interRegular, interSemibold, interBold] = await Promise.all([
    imageToPngDataUri(args.screenshot, shotBoxH * scale),
    imageToPngDataUri(logoPath, logoH * scale),
    readFile(path.join(fontsDir, 'Inter-Regular.ttf')),
    readFile(path.join(fontsDir, 'Inter-SemiBold.ttf')),
    readFile(path.join(fontsDir, 'Inter-Bold.ttf')),
  ]);

  const headlineLines = String(args.headline)
    .split(/\\n|\|/)
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Flexbox layout (Satori) ---
  const copyChildren = [];
  if (eyebrow) {
    copyChildren.push(
      box({ fontSize: 22, fontWeight: 600, letterSpacing: 0.2, color: accent, marginBottom: 22 }, eyebrow),
    );
  }
  copyChildren.push(
    box(
      { display: 'flex', flexDirection: 'column', fontSize: headlineSize, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.06, color: fg },
      headlineLines.map((line) => box({}, line)),
    ),
  );

  const tree = box(
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
      backgroundImage: `linear-gradient(to bottom, ${bgTop}, ${bgBottom})`,
    },
    [
      // Product screenshot, floated right and bleeding off the edge.
      img(shotData, shotBoxW, shotBoxH, {
        position: 'absolute',
        left: shotLeft,
        top: Math.round((H - shotBoxH) / 2),
        borderRadius: radius,
        border: '1px solid rgba(255,255,255,0.10)',
        objectFit: 'cover',
      }),
      // Headline + eyebrow column.
      box({ position: 'absolute', top: 100, left: padX, width: textColW, display: 'flex', flexDirection: 'column' }, copyChildren),
      // Logo.
      img(logoData, logoW, logoH, { position: 'absolute', left: padX, top: H - logoBottom - logoH }),
    ],
  );

  const svg = await satori(tree, {
    width: W,
    height: H,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemibold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
    ],
  });

  const rawPng = new Resvg(svg, { fitTo: { mode: 'width', value: W * scale } }).render().asPng();
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

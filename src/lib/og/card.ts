/**
 * Reusable Open Graph (social) card renderer.
 *
 * Produces one branded 1200×630 PNG per page for og:image / twitter:image,
 * so every page unfurls with a card built from its own title + description
 * instead of the single static site-wide card.
 *
 * Pipeline (no browser — same approach as scripts/marketing-image/generate.mjs):
 *   Satori lays out a flexbox tree -> SVG (text as vector paths)
 *   -> @resvg/resvg-js rasterizes -> sharp emits a compressed PNG.
 *
 * Satori gives us a real flex layout engine, so the title wraps inside its
 * column automatically — no manual text measurement.
 *
 * Rendered before the Astro build by scripts/generate-og-images.ts, so the
 * satori / resvg / sharp devDependencies are only needed during the build and
 * never ship to the browser.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

// Standard Open Graph card size. 1.91:1, the aspect most unfurlers expect.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Supersample so text stays crisp after rasterization.
const SCALE = 2;

const repoRoot = process.cwd();
const fontsDir = path.join(repoRoot, 'scripts', 'marketing-image', 'fonts');
const logoPath = path.join(repoRoot, 'public', 'assets', 'logo_darkbg.svg');

// --- Brand palette --------------------------------------------------------
// Card design decision (flagged for design review): a dark, premium card in
// the same family as the marketing composites, with the site's brand blue
// (--sl-color-accent, #396df1) as the accent. Kept deliberately simple so the
// title reads clearly in a small unfurl.
const BG_TOP = '#15171d'; // almost black
const BG_BOTTOM = '#0a0b0f'; // pure-ish black
const ACCENT = '#6f8bff'; // lightened brand blue, legible on dark
const FG = '#ffffff';
const MUTED = '#c3c9d5';

export interface OgCardInput {
  /** Page title — the card's headline. */
  title: string;
  /** Page description — supporting line under the title. Optional. */
  description?: string;
  /** Small accent label above the title (e.g. "Documentation", "Blog", "Changelog"). */
  eyebrow?: string;
}

// Lazily loaded, then cached for the whole build — every page shares the same
// fonts and logo, so read them from disk once.
let assetsPromise: ReturnType<typeof loadAssets> | null = null;

async function loadAssets() {
  const [interRegular, interSemibold, interBold, logoSvg] = await Promise.all([
    readFile(path.join(fontsDir, 'Inter-Regular.ttf')),
    readFile(path.join(fontsDir, 'Inter-SemiBold.ttf')),
    readFile(path.join(fontsDir, 'Inter-Bold.ttf')),
    rasterizeLogoDataUri(),
  ]);
  return { interRegular, interSemibold, interBold, logoSvg };
}

/** Rasterize the SVG logo to a PNG data URI at a fixed height for the card. */
async function rasterizeLogoDataUri(): Promise<{ src: string; width: number; height: number }> {
  const targetH = 40;
  const meta = await sharp(logoPath, { density: 384 }).metadata();
  const ratio = (meta.width || 1) / (meta.height || 1);
  const width = Math.round(targetH * ratio);
  const buf = await sharp(logoPath, { density: 384 })
    .resize({ height: targetH * SCALE })
    .png()
    .toBuffer();
  return { src: `data:image/png;base64,${buf.toString('base64')}`, width, height: targetH };
}

// Tiny element helpers so the layout reads like JSX (matches generate.mjs).
const box = (style: Record<string, unknown>, children?: unknown) => ({
  type: 'div',
  props: { style, ...(children !== undefined ? { children } : {}) },
});
const img = (src: string, width: number, height: number, style: Record<string, unknown>) => ({
  type: 'img',
  props: { src, width, height, style },
});

/**
 * Render a social card PNG for one page. Returns the raw PNG bytes.
 */
export async function renderOgCard({ title, description, eyebrow }: OgCardInput): Promise<Buffer> {
  if (!assetsPromise) assetsPromise = loadAssets();
  const { interRegular, interSemibold, interBold, logoSvg } = await assetsPromise;

  const padX = 80;
  const padY = 72;

  const copyChildren: unknown[] = [];
  if (eyebrow) {
    copyChildren.push(
      box(
        {
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: ACCENT,
          marginBottom: 24,
        },
        eyebrow,
      ),
    );
  }
  copyChildren.push(
    box(
      {
        display: 'flex',
        fontSize: 68,
        fontWeight: 700,
        letterSpacing: -1.6,
        lineHeight: 1.08,
        color: FG,
        // Clamp very long titles so they never collide with the footer logo.
        maxHeight: 300,
        overflow: 'hidden',
      },
      title,
    ),
  );
  if (description) {
    copyChildren.push(
      box(
        {
          display: 'flex',
          marginTop: 28,
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.35,
          color: MUTED,
          maxHeight: 130,
          overflow: 'hidden',
        },
        description,
      ),
    );
  }

  const tree = box(
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
      padding: `${padY}px ${padX}px`,
      backgroundImage: `linear-gradient(135deg, ${BG_TOP}, ${BG_BOTTOM})`,
    },
    [
      // Accent hairline along the top edge for a branded frame.
      box({
        position: 'absolute',
        top: 0,
        left: 0,
        width: OG_WIDTH,
        height: 10,
        backgroundImage: `linear-gradient(to right, ${ACCENT}, ${BG_TOP})`,
      }),
      // Title block.
      box({ display: 'flex', flexDirection: 'column' }, copyChildren),
      // Footer: logo bottom-left.
      img(logoSvg.src, logoSvg.width, logoSvg.height, { display: 'flex' }),
    ],
  );

  const svg = await satori(tree as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemibold, weight: 600, style: 'normal' },
      { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
    ],
  });

  const rawPng = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH * SCALE } })
    .render()
    .asPng();

  // Downscale the 2× render to the exact card size and compress.
  return sharp(rawPng)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

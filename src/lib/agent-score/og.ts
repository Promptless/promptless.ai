/**
 * On-demand Open Graph card for an Agent Score report (1200×630 PNG).
 *
 * Same pipeline family as src/lib/og/card.ts (Satori → resvg), minus sharp:
 * resvg renders straight to the final size. Runs inside the Vercel function,
 * so the fonts and logo it reads are listed in `agentScoreIncludeFiles` in
 * astro.config.mjs. Kept separate from card.ts on purpose: card.ts is hashed
 * into the static OG manifest, and editing it regenerates every static card.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { GRADE_HEX, gradeTone } from './meta';
import { formatDate } from './report';
import type { SiteResponse } from './types';

const WIDTH = 1200;
const HEIGHT = 630;
const BG_TOP = '#15171d';
const BG_BOTTOM = '#090a0f';
const ACCENT = '#a6b0ff';
const FG = '#ffffff';
const MUTED = '#a7aab5';
const SUBTLE = '#747987';

let assetsPromise: Promise<{ regular: Buffer; semibold: Buffer; bold: Buffer; logo: string }> | null = null;

async function loadAssets() {
  const root = process.cwd();
  const fonts = path.join(root, 'scripts', 'marketing-image', 'fonts');
  const [regular, semibold, bold, logo] = await Promise.all([
    readFile(path.join(fonts, 'Inter-Regular.ttf')),
    readFile(path.join(fonts, 'Inter-SemiBold.ttf')),
    readFile(path.join(fonts, 'Inter-Bold.ttf')),
    readFile(path.join(root, 'public', 'assets', 'logo_darkbg.svg')),
  ]);
  return { regular, semibold, bold, logo: `data:image/svg+xml;base64,${logo.toString('base64')}` };
}

const box = (style: Record<string, unknown>, children?: unknown) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, ...(children !== undefined ? { children } : {}) },
});

function ringSvg(score: number, color: string): string {
  const size = 360;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#252832" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

export async function renderAgentScoreCard(site: SiteResponse): Promise<Buffer> {
  assetsPromise ??= loadAssets().catch((error) => {
    assetsPromise = null;
    throw error;
  });
  const { regular, semibold, bold, logo } = await assetsPromise;
  const { latest } = site;
  const color = GRADE_HEX[gradeTone(latest.grade)];
  const name = site.displayName;
  const nameSize = name.length > 34 ? 46 : name.length > 24 ? 56 : 68;
  const { summary } = latest;
  const line = `${summary.pass}/${summary.total} checks pass${summary.fail ? ` · ${summary.fail} fail` : ''}${summary.warn ? ` · ${summary.warn} warn` : ''}`;
  const bareUrl = latest.scanUrl.replace(/^https?:\/\//, '');
  const subline = bareUrl === name ? `Scanned ${formatDate(latest.scannedAt)}` : `${bareUrl} · scanned ${formatDate(latest.scannedAt)}`;

  const tree = box(
    {
      width: WIDTH,
      height: HEIGHT,
      position: 'relative',
      fontFamily: 'Inter',
      backgroundImage: `linear-gradient(135deg, ${BG_TOP}, ${BG_BOTTOM})`,
      padding: '64px 72px',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    [
      box({ position: 'absolute', top: 0, left: 0, width: WIDTH, height: 8, backgroundImage: `linear-gradient(to right, ${color}, ${BG_TOP})` }),
      box({ flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: 640 }, [
        box({ flexDirection: 'column' }, [
          box({ alignItems: 'center', fontSize: 24, fontWeight: 600, letterSpacing: 3, color: ACCENT, textTransform: 'uppercase' }, [
            box({ width: 14, height: 14, borderRadius: 3, backgroundColor: ACCENT, marginRight: 14 }),
            'Agent Score',
          ]),
          box({ marginTop: 34, fontSize: nameSize, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.08, color: FG, maxHeight: 160, overflow: 'hidden' }, name),
          box({ marginTop: 16, fontSize: 28, color: MUTED }, subline),
          box({ marginTop: 34, fontSize: 30, color: FG, fontWeight: 600 }, line),
        ]),
        box({ flexDirection: 'column' }, [
          box({ alignItems: 'center' }, [
            { type: 'img', props: { src: logo, width: 164, height: 32, style: { display: 'flex' } } },
            box({ marginLeft: 18, fontSize: 22, color: SUBTLE }, 'Agent Score · promptless.ai'),
          ]),
          box({ marginTop: 12, fontSize: 20, color: SUBTLE }, `Powered by afdocs v${latest.engine.version} · Agent-Friendly Docs Spec ${latest.engine.specVersion}`),
        ]),
      ]),
      box({ position: 'relative', width: 360, height: 360, alignItems: 'center', justifyContent: 'center' }, [
        {
          type: 'img',
          props: {
            src: `data:image/svg+xml;base64,${Buffer.from(ringSvg(latest.overall, color)).toString('base64')}`,
            width: 360,
            height: 360,
            style: { position: 'absolute', top: 0, left: 0 },
          },
        },
        box({ flexDirection: 'column', alignItems: 'center' }, [
          box({ fontSize: 132, fontWeight: 700, color: FG, letterSpacing: -5, lineHeight: 1 }, String(latest.overall)),
          box(
            {
              marginTop: 14,
              padding: '6px 18px',
              borderRadius: 10,
              border: `2px solid ${color}`,
              color,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1,
            },
            `GRADE ${latest.grade}`,
          ),
        ]),
      ]),
    ],
  );

  const svg = await satori(tree as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: semibold, weight: 600, style: 'normal' },
      { name: 'Inter', data: bold, weight: 700, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

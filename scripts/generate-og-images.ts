/**
 * Incrementally generate the site's per-page Open Graph images.
 *
 * Images and their input/output hashes are committed so a clean checkout can
 * skip unchanged cards without depending on Vercel's framework build cache.
 * A card is regenerated when its copy changes, the renderer changes, a brand
 * asset changes, or one of the renderer dependency versions changes.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { getOgPages, type OgPage } from '../src/lib/og/pages';
import { renderOgCard } from '../src/lib/og/card';

const MANIFEST_VERSION = 1;
const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'public', 'og');
const manifestPath = path.join(repoRoot, 'src', 'lib', 'generated', 'og-image-manifest.json');

const rendererInputPaths = [
  'src/lib/og/card.ts',
  'scripts/marketing-image/fonts/Inter-Regular.ttf',
  'scripts/marketing-image/fonts/Inter-SemiBold.ttf',
  'scripts/marketing-image/fonts/Inter-Bold.ttf',
  'public/assets/logo_darkbg.svg',
] as const;

const rendererDependencies = ['@resvg/resvg-js', 'satori', 'sharp'] as const;

interface OgImageManifestEntry {
  inputHash: string;
  outputHash: string;
}

interface OgImageManifest {
  version: number;
  rendererHash: string;
  images: Record<string, OgImageManifestEntry>;
}

interface PackageLock {
  packages?: Record<string, { version?: string; integrity?: string }>;
}

function sha256(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

function isMissingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

async function readPreviousManifest(): Promise<OgImageManifest> {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, 'utf8')) as OgImageManifest;
    if (parsed.version === MANIFEST_VERSION && parsed.images) return parsed;
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }

  return { version: MANIFEST_VERSION, rendererHash: '', images: {} };
}

async function getRendererHash(): Promise<string> {
  const hash = createHash('sha256');

  for (const relativePath of rendererInputPaths) {
    hash.update(relativePath);
    hash.update(await readFile(path.join(repoRoot, relativePath)));
  }

  const packageLock = JSON.parse(
    await readFile(path.join(repoRoot, 'package-lock.json'), 'utf8'),
  ) as PackageLock;

  for (const dependency of rendererDependencies) {
    const installed = packageLock.packages?.[`node_modules/${dependency}`];
    if (!installed?.version) {
      throw new Error(`Could not fingerprint ${dependency} from package-lock.json`);
    }
    hash.update(dependency);
    hash.update(installed.version);
    hash.update(installed.integrity ?? '');
  }

  return hash.digest('hex');
}

function getInputHash(page: OgPage, rendererHash: string): string {
  return sha256(
    JSON.stringify({
      rendererHash,
      slug: page.slug,
      title: page.title,
      description: page.description ?? '',
      eyebrow: page.eyebrow ?? '',
    }),
  );
}

function getOutputPath(slug: string): string {
  const resolvedRoot = path.resolve(outputRoot);
  const outputPath = path.resolve(resolvedRoot, `${slug}.png`);

  if (!outputPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to write OG image outside ${resolvedRoot}: ${slug}`);
  }

  return outputPath;
}

async function readOutputHash(outputPath: string): Promise<string | undefined> {
  try {
    return sha256(await readFile(outputPath));
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
}

async function writeAtomically(outputPath: string, contents: Uint8Array | string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, outputPath);
}

function getConcurrency(itemCount: number): number {
  const configured = Number.parseInt(process.env.OG_IMAGE_CONCURRENCY ?? '', 10);
  const desired = Number.isInteger(configured) && configured > 0
    ? configured
    : Math.min(4, availableParallelism());
  return Math.max(1, Math.min(desired, itemCount || 1));
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    }),
  );
}

async function main(): Promise<void> {
  const pages = getOgPages();
  const previousManifest = await readPreviousManifest();
  const rendererHash = await getRendererHash();
  const nextEntries = new Map<string, OgImageManifestEntry>();
  const generatedSlugs: string[] = [];
  let skipped = 0;

  await runWithConcurrency(pages, getConcurrency(pages.length), async (page) => {
    const inputHash = getInputHash(page, rendererHash);
    const outputPath = getOutputPath(page.slug);
    const previousEntry = previousManifest.images[page.slug];

    if (
      previousEntry?.inputHash === inputHash
      && previousEntry.outputHash === await readOutputHash(outputPath)
    ) {
      nextEntries.set(page.slug, previousEntry);
      skipped += 1;
      return;
    }

    const png = await renderOgCard(page);
    await writeAtomically(outputPath, png);
    nextEntries.set(page.slug, { inputHash, outputHash: sha256(png) });
    generatedSlugs.push(page.slug);
  });

  let removed = 0;
  for (const slug of Object.keys(previousManifest.images)) {
    if (nextEntries.has(slug)) continue;
    try {
      await unlink(getOutputPath(slug));
      removed += 1;
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }
  }

  const images = Object.fromEntries(
    [...nextEntries.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
  const nextManifest: OgImageManifest = {
    version: MANIFEST_VERSION,
    rendererHash,
    images,
  };
  await writeAtomically(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);

  console.log(
    `Open Graph images: ${generatedSlugs.length} generated, ${skipped} unchanged, ${removed} removed.`,
  );
  if (generatedSlugs.length > 0 && generatedSlugs.length <= 10) {
    for (const slug of generatedSlugs.sort()) console.log(`  - ${slug}`);
  }
}

main().catch((error) => {
  console.error('Failed to generate Open Graph images:', error);
  process.exitCode = 1;
});

/** Look up the input hash for a pre-generated Open Graph image. */

import manifestJson from '../generated/og-image-manifest.json' with { type: 'json' };

interface OgImageManifest {
  images: Record<string, { inputHash: string }>;
}

const manifest = manifestJson as OgImageManifest;

/**
 * A short content version for cache-busting the stable /og/<slug>.png path.
 * The full hash remains in the generated manifest for collision-safe checks.
 */
export function getOgImageVersion(slug: string): string | undefined {
  return manifest.images[slug]?.inputHash.slice(0, 16);
}

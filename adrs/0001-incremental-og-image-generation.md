# Pre-generate Open Graph images incrementally

- Status: accepted
- Date: 2026-08-11
- Deciders: Promptless engineering

## Context and Problem Statement

The static Astro endpoint for per-page Open Graph images rendered every card through Satori,
Resvg, and Sharp during every deployment. Rendering roughly 150 unchanged images added more than
a minute to the site build, and Astro's static route generation did not reuse Vercel's restored
build cache.

## Decision Drivers

- Keep unique social cards for documentation, blog, changelog, and marketing pages.
- Make normal deployment time proportional to the number of cards whose inputs changed.
- Produce correct images on cold Vercel builds without relying on undocumented cache behavior.
- Invalidate long-lived social-image caches when a card changes.

## Considered Options

- Keep the Astro static endpoint and render every image on every build.
- Replace unique cards with shared cards for large sections of the site.
- Pre-generate cards into `public/og` and track their input and output hashes.

## Decision Outcome

Chosen option: **pre-generate cards into `public/og` with a committed hash manifest**, because a
clean checkout can reuse every unchanged image while still regenerating an individual card when
its copy changes. Renderer source, fonts, logo, and exact renderer dependency versions are part of
the invalidation fingerprint.

### Consequences

- Good: An unchanged build verifies the existing images but performs no Satori, Resvg, or Sharp
  rendering.
- Good: Page copy changes regenerate only that page's card; renderer or brand changes deliberately
  regenerate the complete set.
- Good: The stable image URL gets an input-hash query parameter so long-lived caches fetch changed
  cards while previously shared URLs remain valid.
- Bad / tradeoff: The generated PNGs increase the Git repository and checkout size.
- Follow-up: Keep generated images and `og-image-manifest.json` in commits that change card inputs.

## Pros and Cons of the Options

### Render every image through Astro

- Good: No generated binary assets need to be committed.
- Bad: Every deployment pays the full image-rendering cost, even when no card inputs changed.

### Use shared section cards

- Good: Reduces both rendering work and generated asset count.
- Bad: Removes the per-page title and description that motivated the social-card feature.

### Incrementally pre-generate committed images

- Good: Preserves unique cards and makes cold builds incremental and deterministic.
- Bad: Requires generated assets and their manifest to be kept in sync with source changes.

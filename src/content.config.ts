import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

// Astro 7 removes the legacy `type: 'content'` collections API. These four
// collections move to the `glob()` loader. `base` points at each collection's
// content root so the generated `id` reproduces the old `entry.slug` exactly
// (path relative to base, minus extension) — preserving every /blog, /changelog,
// and website route with no URL diff.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    tag: z.string().optional(),
    section: z.string().optional(),
    date: z.coerce.date(),
    hidden: z.boolean().optional().default(false),
    socialImage: z.string().optional(),
  }),
});

const changelog = defineCollection({
  loader: glob({ base: './src/content/changelog', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    hidden: z.boolean().optional().default(false),
  }),
});

const website = defineCollection({
  loader: glob({ base: './src/content/website', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    routePath: z.string(),
    order: z.number().int().nonnegative(),
    hidden: z.boolean().optional().default(false),
  }),
});

const websiteMarkdown = defineCollection({
  loader: glob({ base: './src/content/websiteMarkdown', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    routePath: z.string(),
    hidden: z.boolean().optional().default(false),
  }),
});

export const collections = {
  docs,
  blog,
  changelog,
  website,
  websiteMarkdown,
};

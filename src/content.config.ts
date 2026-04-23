import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

const blog = defineCollection({
  type: 'content',
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
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    hidden: z.boolean().optional().default(false),
  }),
});

const website = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    routePath: z.string(),
    order: z.number().int().nonnegative(),
    hidden: z.boolean().optional().default(false),
  }),
});

const websiteMarkdown = defineCollection({
  type: 'content',
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

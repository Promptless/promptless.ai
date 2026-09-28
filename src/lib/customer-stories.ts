import { getCollection } from 'astro:content';

export interface CustomerStory {
  title: string;
  description: string;
  highlight?: string;
  href: string;
}

// Customer stories are blog posts under src/content/blog/customer-stories/.
// /customers and /customers.md both read this list, so a new story appears on
// both as soon as it is published.
export async function getCustomerStories(): Promise<CustomerStory[]> {
  const entries = await getCollection(
    'blog',
    ({ id, data }) => id.startsWith('customer-stories/') && !data.hidden,
  );

  return entries
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      highlight: entry.data.highlight,
      href: `/blog/${entry.id}`,
    }));
}

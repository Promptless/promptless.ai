// Customer stories shown on /customers and in the homepage "Customer stories"
// section. Every figure and quote must come verbatim from the cited source
// (the customer's own post, or our published story); see each page under
// src/pages/customers/ for the full text and its source link.

export interface CustomerStoryStat {
  /** The highlighted figure, as the source states it. */
  value: string;
  label: string;
}

export interface CustomerStory {
  slug: string;
  company: string;
  href: string;
  /** Wordmark under public/site/logos/customers/, with its intrinsic size. */
  logo: { src: string; width: number; height: number };
  title: string;
  summary: string;
  stats: CustomerStoryStat[];
}

export const customerStories: CustomerStory[] = [
  {
    slug: 'mautic',
    company: 'Mautic',
    href: '/customers/mautic',
    logo: { src: '/site/logos/customers/mautic.png', width: 1511, height: 395 },
    title: 'How Mautic keeps docs up to date automatically',
    summary:
      'Mautic’s docs had fallen entire release versions behind. Now Promptless drafts a docs PR for each code PR, and developers and the Education Team review every one.',
    stats: [
      { value: '129', label: 'Promptless docs PRs merged in about four months' },
      { value: '~3.5×', label: 'faster from code merge to docs merge: 27 days vs. 98 by hand' },
    ],
  },
  {
    slug: 'vellum',
    company: 'Vellum',
    href: '/customers/vellum',
    logo: { src: '/site/logos/customers/vellum.png', width: 500, height: 186 },
    title: 'How Vellum uses Promptless to draft over 50% of their doc updates',
    summary:
      'Feature owners request doc updates from Promptless directly, so docs became a team sport instead of a hand-off to one docs owner.',
    stats: [
      { value: '54%', label: 'of docs PRs in one month originated from Promptless suggestions' },
      { value: '60%', label: 'of the product and engineering team drafts doc updates with Promptless every month' },
    ],
  },
];

// Blog author profiles, keyed by the `author` frontmatter value on a blog post.
// `author` is optional: posts without it render no by-line or author card.
// A post whose `author` has no entry here still gets a text-only by-line with
// the raw frontmatter value, but no headshot, bio, or author card.
// `photo` is the headshot shown in the by-line and the side card; `role` follows
// the name in the by-line. The optional `bio` (one to three sentences) renders as
// an "About the author" block at the bottom of the post; omit it to show no block.

export interface BlogAuthor {
  photo: string;
  name: string;
  role: string;
  bio?: string;
  linkedin?: string;
  twitter?: string;
}

export const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  Frances: {
    photo: '/assets/frances.jpg',
    name: 'Frances Liu',
    role: 'Co-founder',
    linkedin: 'https://www.linkedin.com/in/frances-liu-1a426057/',
    twitter: 'https://x.com/robobobots',
  },
  Prithvi: {
    photo: '/assets/prithvi.jpg',
    name: 'Prithvi Ramakrishnan',
    role: 'Co-founder',
    bio: 'Prithvi co-founded Promptless. Before Promptless, he served as VP of Product & Engineering at Bond, a fintech infrastructure startup acquired by FIS in 2023. There he saw firsthand the effort required to maintain hundreds of tutorials and guides and the outsized business impact of world-class documentation. Prithvi graduated from Stanford in 2015 (B.S. CS, AI track).',
    linkedin: 'https://www.linkedin.com/in/prithvi-r/',
    twitter: 'https://x.com/prithviramak',
  },
  InlinePizza: {
    photo: '/assets/inlinepizza.jpg',
    name: 'InlinePizza',
    role: 'Founding Engineer',
    twitter: 'https://twitter.com/InlinePizza',
  },
  Manny: {
    photo: '/assets/manny.jpg',
    name: 'Manny Silva',
    role: 'Head of AI Docs Practice',
    bio: 'Manny Silva is Head of AI Docs Practice at Promptless, where he helps teams optimize their documentation workflows. He has built documentation for Apple, Google, and startups of various sizes. He codified the Docs as Tests strategy and created Doc Detective, an open-source tool for testing documentation. He wrote Docs as Tests: A Strategy for Resilient Technical Documentation and its follow-up, Docs as Tests & AI: A Strategy for Self-Healing Technical Documentation. He likes diving into the deep end as the zeroth user.',
    linkedin: 'https://www.linkedin.com/in/manuelrbsilva',
  },
};

export function getBlogAuthor(author: string): BlogAuthor | undefined {
  return BLOG_AUTHORS[author];
}

/** Display name for a by-line: the profile's full name, or the raw frontmatter value. */
export function getBlogAuthorName(author: string): string {
  return BLOG_AUTHORS[author]?.name ?? author;
}

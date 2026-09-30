// Blog author profiles, keyed by the `author` frontmatter value on a blog post.
// `author` is optional: posts without it render no by-line or author card.
// A post whose `author` has no entry here still gets a text-only by-line with
// the raw frontmatter value, but no headshot, description, or author card.
// `photo` is the headshot shown in the by-line and the side card; `role` and
// the optional one- or two-sentence `bio` form the by-line's author description.

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
    linkedin: 'https://www.linkedin.com/in/prithvi-r/',
    twitter: 'https://x.com/prithviramak',
  },
  InlinePizza: {
    photo: '/assets/inlinepizza.jpg',
    name: 'InlinePizza',
    role: 'Founding Engineer',
    twitter: 'https://twitter.com/InlinePizza',
  },
};

export function getBlogAuthor(author: string): BlogAuthor | undefined {
  return BLOG_AUTHORS[author];
}

/** Display name for a by-line: the profile's full name, or the raw frontmatter value. */
export function getBlogAuthorName(author: string): string {
  return BLOG_AUTHORS[author]?.name ?? author;
}

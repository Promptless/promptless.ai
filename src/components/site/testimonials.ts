import type { ImageMetadata } from 'astro';

import alanImg from '../../assets/site/alan.jpeg';
import moImg from '../../assets/site/mo.jpeg';
import aaronImg from '../../assets/site/aaron.jpeg';
import eduardoImg from '../../assets/site/eduardo.jpeg';
import nicholasImg from '../../assets/site/nicholas.jpeg';

export interface Testimonial {
  quote: string;
  author: string;
  title: string;
  company: string;
  companyLogo: ImageMetadata | string;
  image: ImageMetadata;
}

// Published customer testimonials. The homepage carousels (Testimonials.astro,
// TestimonialsVertical.astro) and the /wall-of-love page all read from this
// list, so a quote added or edited here appears everywhere. Keep
// src/content/websiteMarkdown/wall-of-love.md and home.md in sync by hand.
export const testimonials: Testimonial[] = [
  {
    quote:
      'Promptless dramatically speeds up my time-to-first-draft. My team literally calls me a 10x tech writer.',
    author: 'Mo King',
    title: 'Senior Technical Writer',
    company: 'Runpod',
    companyLogo: '/site/logos/runpod.png',
    image: moImg,
  },
  {
    quote:
      'This is the most "make something people want" feature I have ever seen. It solves my problem in a better way than I thought would be possible.',
    author: 'Alan Mond',
    title: 'Docs Maintainer',
    company: 'Bazel',
    companyLogo: '/site/logos/bazel-icon.png',
    image: alanImg,
  },
  {
    quote:
      "Promptless updates every relevant section of our docs, catching both the latest changes and old spots we'd missed. It feels like magic.",
    author: 'Aaron Levin',
    title: 'Founding Solutions Engineer',
    company: 'Vellum',
    companyLogo: '/site/logos/vellum-icon.svg',
    image: aaronImg,
  },
  {
    quote: 'I love your product. It works incredibly well and basically pays for itself right away.',
    author: 'Eduardo Soubihe',
    title: 'CTO',
    company: 'Latitude.sh',
    companyLogo: '/site/logos/latitude.svg',
    image: eduardoImg,
  },
  {
    quote: "Promptless is a solo tech writer's godsend.",
    author: 'Nicholas DeWald',
    title: 'Head of Developer Docs',
    company: 'Prove',
    companyLogo: '/site/logos/prove-icon.svg',
    image: nicholasImg,
  },
];

// Quotes from the Vellum customer story (src/content/blog/customer-stories/vellum.mdx).
// They appear on /wall-of-love only; keep them verbatim with the story.
export const vellumStoryTestimonials: Testimonial[] = [
  {
    quote:
      'Dropping screenshots into Slack and letting Promptless interpret them—ordering images, explaining around them—has been a game-changer for our UI tutorials. It genuinely feels like magic.',
    author: 'Aaron Levin',
    title: 'Founding Solutions Engineer',
    company: 'Vellum',
    companyLogo: '/site/logos/vellum-icon.svg',
    image: aaronImg,
  },
  {
    quote:
      'Before, only a docs‑owner or someone steeped in our style guide could update docs. Now Promptless standardizes everything, so anyone on the team can contribute.',
    author: 'Aaron Levin',
    title: 'Founding Solutions Engineer',
    company: 'Vellum',
    companyLogo: '/site/logos/vellum-icon.svg',
    image: aaronImg,
  },
];

export const VELLUM_STORY_PATH = '/blog/customer-stories/vellum';

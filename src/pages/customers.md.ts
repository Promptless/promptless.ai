import type { APIRoute } from 'astro';
import { createWebsiteMarkdownResponse } from '@lib/website-markdown';
import { getCustomerStories } from '@lib/customer-stories';

// src/content/websiteMarkdown/customers.md marks where the story list goes.
const STORY_LIST_MARKER = '{{customer-stories}}';

export const GET: APIRoute = async () =>
  createWebsiteMarkdownResponse('/customers', {
    transformBody: async (body) => {
      if (!body.includes(STORY_LIST_MARKER)) {
        throw new Error(`customers.md is missing the ${STORY_LIST_MARKER} marker`);
      }
      const stories = await getCustomerStories();
      const list = stories
        .map((story) => {
          const summary = story.highlight ?? story.description;
          return `- [${story.title}](https://promptless.ai${story.href}): ${summary}`;
        })
        .join('\n');
      return body.replace(STORY_LIST_MARKER, list);
    },
  });

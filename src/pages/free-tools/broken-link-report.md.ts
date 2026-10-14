import type { APIRoute } from 'astro';
import { createWebsiteMarkdownResponse } from '@lib/website-markdown';

export const GET: APIRoute = async () => createWebsiteMarkdownResponse('/free-tools/broken-link-report');

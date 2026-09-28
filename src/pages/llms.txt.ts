import type { APIRoute } from 'astro';
import { docsPage, link, llmsIndexResponse, marketingPage, type LlmsSection } from '@lib/llms-index';

// The site's llms.txt entrypoint, modeled on mintlify.com/llms.txt: a blurb,
// then every important page's markdown twin grouped by site section, with
// nested indexes for the docs, blog, and changelog. This project route replaces
// the fixed-format index the starlight-llms-txt plugin would inject at the same
// path (see src/lib/starlight-llms-corpora.ts). The signup URL and plan prices
// are the only hand-written facts; keep them in step with the quickstart and
// src/content/website/pricing.mdx.

export const prerender = true;

const BLURB =
  'Promptless is an AI agent that keeps customer-facing documentation and agent instructions in sync with what your team ships: documentation pull requests drafted from code changes, Slack threads, and tickets, with citations, for docs teams and solo technical writers on any Git-backed docs platform.';

const NOTE =
  'This file indexes the markdown version of every page on promptless.ai. Append `.md` to any page URL (or send `Accept: text/markdown`) to get its markdown twin.';

async function buildSections(): Promise<LlmsSection[]> {
  return [
    {
      heading: 'Docs',
      links: [
        link('Documentation index', '/docs/llms.txt', 'llms.txt index of the full product documentation, every page with its .md link'),
        docsPage('/docs/for-docs/start-here/welcome', { label: 'Documentation home' }),
        docsPage('/docs/for-docs/start-here/quickstart', {
          label: 'Quickstart',
          description:
            'Sign up free at https://accounts.gopromptless.ai, install the GitHub App on your docs repo, connect Slack, and configure triggers in promptless.yaml. Every plan includes a 14-day free trial.',
        }),
        docsPage('/docs/for-docs/connect/triggers', { label: 'Triggers' }),
        docsPage('/docs/for-docs/migrate/choose-a-platform', {
          description:
            'Any Git-backed platform works: Mintlify, Fern, ReadMe, GitBook, Docusaurus, MkDocs, Hugo, Ghost, Nextra, Starlight, Vocs, or a custom site built from a repository.',
        }),
        docsPage('/docs/for-docs/connect/triggers/mcp', {
          label: 'MCP setup',
          description:
            'Connect Claude Code with `claude mcp add --transport http promptless https://api.gopromptless.ai/mcp`; the page has the Cursor, VS Code, and Codex commands. OAuth sign-in, and it requires an existing Promptless organization.',
        }),
        docsPage('/docs/governance', { label: 'Agent Instructions documentation' }),
        link('Full corpus', '/llms-full.txt', 'every documentation page in one file'),
        link('Abridged corpus', '/llms-small.txt', 'the documentation with asides and details removed'),
      ],
    },
    {
      heading: 'Pages',
      links: [
        await marketingPage('/', {
          description:
            'Promptless for Docs and Promptless for Agent Instructions, with testimonials from Runpod, Bazel, Vellum, Latitude.sh, and Prove, and public Promptless pull requests in Vitess and Helm.',
        }),
        await marketingPage('/pricing', {
          label: 'Pricing',
          description:
            'Startup is $500/month for up to 200 pages with a 14-day free trial. Growth runs $500 to $4,000/month by page count and adds Jira, Linear, Confluence, Notion, translations, and screenshot updates. Enterprise is custom. Agent-instructions plans are quoted.',
        }),
        await marketingPage('/demo', {
          label: 'Book a demo',
          description: 'A 15-minute call with a Promptless engineer. A 14-day free trial is included.',
        }),
        docsPage('/docs/for-docs/start-here/open-source-quickstart', {
          label: 'Open-source program',
          description: 'Promptless is free for CNCF, Linux Foundation, and other eligible non-commercial open-source projects.',
        }),
        docsPage('/docs/for-docs/starport', { label: 'Starport' }),
        docsPage('/docs/for-docs/get-the-most-out/screenshots', { label: 'Promptless Capture' }),
        await marketingPage('/free-tools', {
          description: 'Broken Link Report: scan a docs site and get the report by email.',
        }),
      ],
    },
    {
      heading: 'Blog',
      intro: 'Product updates, technical writing, and customer stories.',
      links: [
        link('Blog posts index (nested)', '/blog/llms.txt', 'every post with its .md link'),
        link('Blog listing', '/blog', 'the blog page (HTML)'),
      ],
    },
    {
      heading: 'Changelog',
      intro: 'Monthly summaries of user-visible changes.',
      links: [
        link('Changelog index (nested)', '/changelog/llms.txt', 'every entry with its .md link'),
        link('Changelog listing', '/changelog', 'the changelog page (HTML)'),
      ],
    },
    {
      heading: 'Customers',
      intro: 'Stories and public work from teams that use Promptless.',
      links: [
        docsPage('/blog/customer-stories/vellum', { description: 'Customer story' }),
        await marketingPage('/', {
          label: 'Testimonials',
          description:
            'Runpod, Bazel, Vellum, Latitude.sh, and Prove, on the homepage, with the customer list: Megaport, Mezmo, Vitess, Helm, Aptible, Runpod, Flatfile, Latitude, Mautic, Vellum, Coactive, Rain, Miter, and Basis.',
        }),
        link(
          'Promptless pull requests in Vitess',
          'https://github.com/vitessio/website/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'public PRs on a CNCF project, each reviewed by the Vitess docs maintainers',
        ),
        link(
          'Promptless pull requests in Helm',
          'https://github.com/helm/helm-www/pulls?q=is%3Apr+author%3Apromptless-for-oss',
          'public PRs on a CNCF project (Docusaurus)',
        ),
        link(
          'Promptless pull requests in Runpod docs',
          'https://github.com/runpod/docs/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'public PRs on a customer docs repo (Mintlify)',
        ),
        link(
          'Promptless pull requests in Mautic docs',
          'https://github.com/mautic/user-documentation/pulls?q=is%3Apr+author%3Apromptless-for-oss',
          'public PRs on an open-source project (Sphinx)',
        ),
        link(
          'Promptless pull requests in Bazel docs',
          'https://github.com/bazel-contrib/bazel-docs/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'public PRs on an open-source project (Mintlify)',
        ),
      ],
    },
    {
      heading: 'Security',
      intro: 'Security and data-handling policies.',
      links: [
        docsPage('/docs/for-docs/security/data-handling-and-classification'),
        docsPage('/docs/for-docs/security/how-promptless-uses-ai'),
        docsPage('/docs/for-docs/security/access-and-permissions'),
        docsPage('/docs/for-docs/security/secrets-and-sensitive-data'),
        docsPage('/docs/for-docs/security/network-architecture'),
        docsPage('/docs/for-docs/security/subprocessors'),
        docsPage('/docs/for-docs/security/privacy-policy'),
        docsPage('/docs/for-docs/security/single-sign-on'),
      ],
    },
    {
      heading: 'Optional',
      links: [link('Sitemap', '/sitemap-index.xml', 'XML sitemap of the HTML pages')],
    },
  ];
}

export const GET: APIRoute = async ({ site }) =>
  llmsIndexResponse({ title: 'Promptless', blurb: BLURB, note: NOTE, sections: await buildSections() }, site);

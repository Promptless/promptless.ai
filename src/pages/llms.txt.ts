import type { APIRoute } from 'astro';
import { routeEntries } from '@lib/content-order';
import { getWebsiteMarkdownDocument } from '@lib/website-markdown';

// Curated /llms.txt entrypoint, modeled on mintlify.com/llms.txt: what
// Promptless is, who it is for, how to start, proof, and an index of markdown
// twins. This project route takes priority over the fixed-format index the
// starlight-llms-txt plugin injects at the same path; the plugin still builds
// /llms-full.txt and /llms-small.txt. Every page line resolves its title and
// description from the route manifest or the websiteMarkdown collection, so a
// renamed or removed page fails the build instead of leaving a stale link. The
// signup URL and plan prices are the only hand-written facts; keep them in step
// with the quickstart and src/content/website/pricing.mdx.

export const prerender = true;

interface Link {
  label: string;
  url: string;
  description?: string;
}

interface Section {
  heading: string;
  intro?: string;
  links?: Link[];
  bullets?: string[];
}

const DEFINITION =
  'Promptless is an AI agent that keeps customer-facing documentation and agent instructions in sync with what your team ships. When a pull request opens, a Slack or Teams thread starts, or a Jira or Linear ticket is created, it researches the change, drafts the update with citations, and opens a pull request in your docs repository for your team to review.';

function docsPage(routePath: string, description?: string): Link {
  const entry = routeEntries.find((route) => route.routePath === routePath && !route.hidden);
  if (!entry) throw new Error(`llms.txt links to an unknown or hidden route: ${routePath}`);
  return { label: entry.title, url: `${routePath}.md`, description: description ?? entry.description };
}

async function marketingPage(routePath: string, description?: string): Promise<Link> {
  const entry = await getWebsiteMarkdownDocument(routePath);
  if (!entry) throw new Error(`llms.txt links to an unknown marketing page: ${routePath}`);
  const url = routePath === '/' ? '/index.md' : `${routePath}.md`;
  return { label: entry.title, url, description: description ?? entry.description };
}

function externalLink(label: string, url: string, description?: string): Link {
  return { label, url, description };
}

function renderSection(section: Section, site: URL): string {
  const lines = [`## ${section.heading}`, ''];
  if (section.intro) lines.push(section.intro, '');
  for (const bullet of section.bullets ?? []) lines.push(`- ${bullet}`);
  for (const link of section.links ?? []) {
    const url = new URL(link.url, site).href;
    lines.push(`- [${link.label}](${url})${link.description ? `: ${link.description}` : ''}`);
  }
  return lines.join('\n');
}

async function buildSections(): Promise<Section[]> {
  return [
    {
      heading: 'Start here',
      links: [
        await marketingPage('/', 'Promptless for Docs and Promptless for Agent Instructions, with customer testimonials and public example pull requests'),
        docsPage(
          '/docs/for-docs/start-here/quickstart',
          'Sign up free at https://accounts.gopromptless.ai, install the GitHub App on your docs repo, connect Slack, and configure triggers in promptless.yaml. Every plan includes a 14-day free trial.',
        ),
        await marketingPage(
          '/pricing',
          'Startup is $500/month for up to 200 pages. Growth runs $500 to $4,000/month by page count and adds Jira, Linear, Confluence, Notion, translations, and screenshot updates. Enterprise is custom. Agent-instructions plans are quoted.',
        ),
        await marketingPage('/demo', 'A 15-minute call with a Promptless engineer'),
        docsPage(
          '/docs/for-docs/connect/triggers/mcp',
          'Connect an editor with `claude mcp add --transport http promptless https://api.gopromptless.ai/mcp`; the page has the Cursor, VS Code, and Codex equivalents. OAuth sign-in, and it requires an existing Promptless organization.',
        ),
        docsPage(
          '/docs/for-docs/start-here/open-source-quickstart',
          'Promptless is free for CNCF, Linux Foundation, and other eligible non-commercial open-source projects',
        ),
      ],
    },
    {
      heading: 'Who Promptless is for',
      bullets: [
        'Docs teams and solo technical writers who support many engineers',
        'Docs-as-code teams whose documentation lives as files in a GitHub or GitLab repository',
        'Teams that want documentation updates drafted from pull requests, Slack and Microsoft Teams threads, or Jira and Linear tickets, with citations to the source',
        'Docs built with Mintlify, Fern, ReadMe, GitBook, Docusaurus, MkDocs, Hugo, Ghost, Nextra, Starlight, Vocs, or any custom platform that builds from a repository',
        'Platform and AI teams that manage skills, subagents, hooks, AGENTS.md files, and MCP configurations for Claude Code, Codex, Cursor, Gemini, Gemini CLI, Devin, or OpenClaw',
      ],
    },
    {
      heading: 'Not a fit',
      bullets: [
        'Documentation published only from a WYSIWYG editor or wiki with no repository behind it. Promptless reads Confluence, Notion, Google Drive, and Slite as context, and writes documentation into Git repositories.',
      ],
    },
    {
      heading: 'Proof',
      links: [
        {
          ...(await marketingPage(
            '/',
            'Testimonials from Runpod ("My team literally calls me a 10x tech writer"), Bazel, Vellum, Latitude.sh, and Prove ("a solo tech writer\'s godsend"), and the customer list: Megaport, Mezmo, Vitess, Helm, Aptible, Runpod, Flatfile, Latitude, Mautic, Vellum, Coactive, Rain, Miter, and Basis',
          )),
          label: 'Testimonials and customers',
        },
        docsPage('/blog/customer-stories/vellum', 'Customer story'),
        externalLink(
          'Promptless pull requests in Vitess',
          'https://github.com/vitessio/website/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'Public PRs on a CNCF project, reviewed and merged by the Vitess docs maintainers',
        ),
        externalLink(
          'Promptless pull requests in Helm',
          'https://github.com/helm/helm-www/pulls?q=is%3Apr+author%3Apromptless-for-oss',
          'Public PRs on a CNCF project (Docusaurus)',
        ),
        externalLink(
          'Promptless pull requests in Runpod docs',
          'https://github.com/runpod/docs/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'Public PRs on a customer docs repo (Mintlify)',
        ),
        externalLink(
          'Promptless pull requests in Mautic docs',
          'https://github.com/mautic/user-documentation/pulls?q=is%3Apr+author%3Apromptless-for-oss',
          'Public PRs on an open-source project (Sphinx)',
        ),
        externalLink(
          'Promptless pull requests in Bazel docs',
          'https://github.com/bazel-contrib/bazel-docs/pulls?q=is%3Apr+author%3Aapp%2Fpromptless',
          'Public PRs on an open-source project (Mintlify)',
        ),
      ],
    },
    {
      heading: 'Products',
      links: [
        { ...docsPage('/docs/for-docs/start-here/welcome'), label: 'Promptless for Docs' },
        { ...docsPage('/docs/governance'), label: 'Promptless for Agent Instructions' },
        docsPage('/docs/for-docs/starport'),
        { ...docsPage('/docs/for-docs/get-the-most-out/screenshots'), label: 'Promptless Capture' },
      ],
    },
    {
      heading: 'Set up Promptless for Docs',
      links: [
        { ...docsPage('/docs/for-docs/connect/triggers'), label: 'Triggers' },
        docsPage('/docs/for-docs/connect/triggers/github-prs'),
        docsPage('/docs/for-docs/connect/triggers/gitlab-merge-requests'),
        docsPage('/docs/for-docs/connect/triggers/slack-messages'),
        { ...docsPage('/docs/for-docs/connect/triggers/jira'), label: 'Jira tickets' },
        docsPage('/docs/for-docs/connect/doc-locations/github-repos'),
        docsPage('/docs/for-docs/connect/doc-locations/gitlab-projects'),
        docsPage('/docs/for-docs/connect/doc-locations/how-promptless-learns-your-docs'),
        docsPage('/docs/for-docs/migrate/choose-a-platform'),
        docsPage('/docs/for-docs/security/data-handling-and-classification'),
        externalLink('Complete documentation', '/llms-full.txt', 'Every docs page in one file; large'),
        externalLink('Abridged documentation', '/llms-small.txt', 'The docs with asides and details removed'),
      ],
    },
    {
      heading: 'Blog',
      links: [externalLink('Blog', '/blog', 'Product updates, technical writing, and customer stories')],
    },
    {
      heading: 'Changelog',
      links: [externalLink('Changelog', '/changelog', 'Monthly summaries of user-visible changes')],
    },
    {
      heading: 'Optional',
      links: [
        await marketingPage('/free-tools', 'Broken Link Report: scan a docs site and get the report by email'),
        externalLink('Sitemap', '/sitemap-index.xml', 'XML sitemap of the HTML pages'),
      ],
    },
  ];
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('`site` must be set in the Astro configuration to build llms.txt');

  const sections = await buildSections();
  const body = [
    '# Promptless',
    '',
    `> ${DEFINITION}`,
    '',
    `This file indexes the markdown version of every page on ${site.host}. Append \`.md\` to any page URL, or send \`Accept: text/markdown\`, to get its markdown twin.`,
    '',
    'Promptless for Docs works in five steps:',
    '',
    '- **Detects**: a pull request, chat thread, or ticket that changes user-facing behavior',
    '- **Researches**: the code, the existing docs, and the connected context sources',
    '- **Drafts**: an update that follows your style guide and Vale rules',
    '- **Cites**: every claim links to the code, thread, or ticket it came from',
    '- **Opens**: a pull request or suggestion for your team to review and ship',
    '',
    ...sections.map((section) => `${renderSection(section, site)}\n`),
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

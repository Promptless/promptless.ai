import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startPreviewServer, type PreviewServer } from './preview-server';

let preview: PreviewServer;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPrimaryNav(html: string): string {
  const nav = html.match(/<nav[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/i)?.[0];
  assert.ok(nav, 'Primary nav was not rendered.');
  return nav;
}

function assertLink(navHtml: string, href: string, label: string) {
  const pattern = new RegExp(
    `<a(?=[^>]*href="${escapeRegExp(href)}")[^>]*>[\\s\\S]*?${escapeRegExp(label)}[\\s\\S]*?<\\/a>`,
    'i'
  );
  assert.match(navHtml, pattern, `Missing nav link ${label} -> ${href}`);
}

function assertActiveLink(navHtml: string, href: string, label: string) {
  const pattern = new RegExp(
    `<a(?=[^>]*href="${escapeRegExp(href)}")(?=[^>]*class="[^"]*\\bactive\\b[^"]*")[^>]*>[\\s\\S]*?${escapeRegExp(
      label
    )}[\\s\\S]*?<\\/a>`,
    'i'
  );
  assert.match(navHtml, pattern, `Expected ${href} to be active for ${label}.`);
}

function assertInactiveLink(navHtml: string, href: string, label: string) {
  const pattern = new RegExp(
    `<a(?=[^>]*href="${escapeRegExp(href)}")(?=[^>]*class="[^"]*\\bactive\\b[^"]*")[^>]*>[\\s\\S]*?${escapeRegExp(
      label
    )}[\\s\\S]*?<\\/a>`,
    'i'
  );
  assert.doesNotMatch(navHtml, pattern, `Did not expect ${href} to be active for ${label}.`);
}

function assertLabelOrder(navHtml: string, labels: string[]) {
  let previousIndex = -1;
  for (const label of labels) {
    const index = navHtml.indexOf(label);
    assert.notEqual(index, -1, `Expected to find ${label} in primary nav.`);
    if (previousIndex !== -1) {
      assert.ok(previousIndex < index, `Expected ${label} after previous primary nav item.`);
    }
    previousIndex = index;
  }
}

before(async () => {
  preview = await startPreviewServer();
});

after(async () => {
  await preview.close();
});

test('/blog and /changelog are browsable canonical index pages', async () => {
  const blogResponse = await fetch(`${preview.baseUrl}/blog`);
  assert.equal(blogResponse.status, 200);
  const blogHtml = await blogResponse.text();
  assert.match(blogHtml, /<h1[^>]*>\s*Blog\s*<\/h1>/);
  assert.match(blogHtml, /class="collection-feed[\s"]/);
  assert.match(blogHtml, /class="collection-feed-item[\s"]/);
  assert.match(blogHtml, /class="collection-tag[\s"]/);

  const changelogResponse = await fetch(`${preview.baseUrl}/changelog`);
  assert.equal(changelogResponse.status, 200);
  const changelogHtml = await changelogResponse.text();
  assert.match(changelogHtml, /<h1[^>]*>\s*Changelog\s*<\/h1>/);
  assert.match(changelogHtml, /class="collection-feed[\s"]/);
  assert.match(changelogHtml, /class="collection-feed-item[\s"]/);
});

test('blog and changelog detail pages include top and bottom canonical back links', async () => {
  const blogResponse = await fetch(`${preview.baseUrl}/blog/technical/i-must-scream`);
  assert.equal(blogResponse.status, 200);
  const blogHtml = await blogResponse.text();
  const blogBackLinks = blogHtml.match(/href="\/blog">← Back to Blog<\/a>/g) ?? [];
  assert.equal(blogBackLinks.length, 2, 'Expected top and bottom blog back links.');

  const changelogResponse = await fetch(`${preview.baseUrl}/changelog/changelogs/january-2026`);
  assert.equal(changelogResponse.status, 200);
  const changelogHtml = await changelogResponse.text();
  const changelogBackLinks =
    changelogHtml.match(/href="\/changelog">← Back to Changelog<\/a>/g) ?? [];
  assert.equal(changelogBackLinks.length, 2, 'Expected top and bottom changelog back links.');
});

test('llms endpoints remain available', async () => {
  const llms = await fetch(`${preview.baseUrl}/llms.txt`);
  assert.equal(llms.status, 200);
  const llmsBody = await llms.text();
  assert.match(llmsBody, /## Website/i);
  assert.match(llmsBody, /## Docs/i);

  const llmsFull = await fetch(`${preview.baseUrl}/llms-full.txt`);
  assert.equal(llmsFull.status, 200);
  const llmsFullBody = await llmsFull.text();
  assert.match(llmsFullBody, /## Website/i);
  assert.match(llmsFullBody, /## Docs/i);
});

test('homepage and docs pages include the llms.txt directive in html', async () => {
  const homepage = await fetch(`${preview.baseUrl}/`);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /href="\/llms\.txt"[^>]*>llms\.txt<\/a>/i);

  const docsPage = await fetch(`${preview.baseUrl}/docs/getting-started/welcome`);
  assert.equal(docsPage.status, 200);
  assert.match(await docsPage.text(), /href="\/llms\.txt"[^>]*>llms\.txt<\/a>/i);
});

test('primary nav keeps canonical routes with free tools tab', async () => {
  const response = await fetch(`${preview.baseUrl}/docs/getting-started/welcome`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const nav = getPrimaryNav(html);

  assertLink(nav, '/', 'Home');
  assertLink(nav, '/pricing', 'Pricing');
  assertLink(nav, '/docs', 'Docs');
  assertLink(nav, '/blog', 'Blog');
  assertLink(nav, '/changelog', 'Changelog');
  assertLink(nav, '/free-tools', 'Free tools');
  assertLink(nav, '/wtd-portland-2026', 'WTD 2026');

  assertLabelOrder(nav, ['Home', 'Pricing', 'Docs', 'Blog', 'Changelog', 'Free tools', 'WTD 2026']);
  assert.doesNotMatch(nav, /href="\/blog\/all"/);
  assert.doesNotMatch(nav, /href="\/changelog\/all"/);
});

test('website/docs/blog/changelog/free tools active state is correct', async () => {
  const websiteHtml = await (await fetch(`${preview.baseUrl}/`)).text();
  const websitePricingHtml = await (await fetch(`${preview.baseUrl}/pricing`)).text();
  const meetHtml = await (await fetch(`${preview.baseUrl}/meet`)).text();
  const docsHtml = await (await fetch(`${preview.baseUrl}/docs/getting-started/welcome`)).text();
  const blogHtml = await (await fetch(`${preview.baseUrl}/blog`)).text();
  const changelogHtml = await (await fetch(`${preview.baseUrl}/changelog`)).text();
  const freeToolsIndexHtml = await (await fetch(`${preview.baseUrl}/free-tools`)).text();
  const freeToolsToolHtml = await (await fetch(`${preview.baseUrl}/free-tools/broken-link-report`)).text();

  const websiteNav = getPrimaryNav(websiteHtml);
  assertActiveLink(websiteNav, '/', 'Home');
  assertInactiveLink(websiteNav, '/docs', 'Docs');
  assertInactiveLink(websiteNav, '/blog', 'Blog');
  assertInactiveLink(websiteNav, '/changelog', 'Changelog');
  assertInactiveLink(websiteNav, '/free-tools', 'Free tools');

  const pricingNav = getPrimaryNav(websitePricingHtml);
  assertActiveLink(pricingNav, '/pricing', 'Pricing');
  assertInactiveLink(pricingNav, '/', 'Home');

  const meetNav = getPrimaryNav(meetHtml);
  assertInactiveLink(meetNav, '/', 'Home');

  const docsNav = getPrimaryNav(docsHtml);
  assertActiveLink(docsNav, '/docs', 'Docs');
  assertInactiveLink(docsNav, '/', 'Home');
  assertInactiveLink(docsNav, '/blog', 'Blog');
  assertInactiveLink(docsNav, '/changelog', 'Changelog');
  assertInactiveLink(docsNav, '/free-tools', 'Free tools');

  const blogNav = getPrimaryNav(blogHtml);
  assertActiveLink(blogNav, '/blog', 'Blog');
  assertInactiveLink(blogNav, '/', 'Home');
  assertInactiveLink(blogNav, '/docs', 'Docs');
  assertInactiveLink(blogNav, '/changelog', 'Changelog');
  assertInactiveLink(blogNav, '/free-tools', 'Free tools');

  const changelogNav = getPrimaryNav(changelogHtml);
  assertActiveLink(changelogNav, '/changelog', 'Changelog');
  assertInactiveLink(changelogNav, '/', 'Home');
  assertInactiveLink(changelogNav, '/docs', 'Docs');
  assertInactiveLink(changelogNav, '/blog', 'Blog');
  assertInactiveLink(changelogNav, '/free-tools', 'Free tools');

  const freeToolsIndexNav = getPrimaryNav(freeToolsIndexHtml);
  assertActiveLink(freeToolsIndexNav, '/free-tools', 'Free tools');
  assertInactiveLink(freeToolsIndexNav, '/', 'Home');
  assertInactiveLink(freeToolsIndexNav, '/docs', 'Docs');
  assertInactiveLink(freeToolsIndexNav, '/blog', 'Blog');
  assertInactiveLink(freeToolsIndexNav, '/changelog', 'Changelog');

  const freeToolsToolNav = getPrimaryNav(freeToolsToolHtml);
  assertActiveLink(freeToolsToolNav, '/free-tools', 'Free tools');
  assertInactiveLink(freeToolsToolNav, '/', 'Home');
  assertInactiveLink(freeToolsToolNav, '/docs', 'Docs');
  assertInactiveLink(freeToolsToolNav, '/blog', 'Blog');
  assertInactiveLink(freeToolsToolNav, '/changelog', 'Changelog');
});

test('/blog/all and /changelog/all remain compatibility redirects', async () => {
  const blogAll = await fetch(`${preview.baseUrl}/blog/all`, { redirect: 'manual' });
  if (blogAll.status >= 300 && blogAll.status < 400) {
    assert.equal(blogAll.headers.get('location'), '/blog');
  } else {
    assert.equal(blogAll.status, 200);
    const body = await blogAll.text();
    assert.match(body, /Redirecting to: \/blog/);
  }

  const changelogAll = await fetch(`${preview.baseUrl}/changelog/all`, { redirect: 'manual' });
  if (changelogAll.status >= 300 && changelogAll.status < 400) {
    assert.equal(changelogAll.headers.get('location'), '/changelog');
  } else {
    assert.equal(changelogAll.status, 200);
    const body = await changelogAll.text();
    assert.match(body, /Redirecting to: \/changelog/);
  }
});

test('website routes are canonicalized to /, /meet, and /pricing', async () => {
  const homepage = await fetch(`${preview.baseUrl}/`);
  assert.equal(homepage.status, 200);
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /pl-site-page/);
  assert.match(homepageHtml, /How Promptless works/);

  const homeAlias = await fetch(`${preview.baseUrl}/home`, { redirect: 'manual' });
  if (homeAlias.status >= 300 && homeAlias.status < 400) {
    assert.equal(homeAlias.headers.get('location'), '/');
  } else {
    assert.equal(homeAlias.status, 200);
    assert.match(await homeAlias.text(), /Redirecting to: \//);
  }

  const demo = await fetch(`${preview.baseUrl}/demo`);
  assert.equal(demo.status, 200);
  // /demo is now a client-side redirect page to /#demo
  assert.match(await demo.text(), /\/#demo/);

  const meet = await fetch(`${preview.baseUrl}/meet`);
  assert.equal(meet.status, 200);
  assert.match(await meet.text(), /cal-inline-demo-booking/);

  const pricing = await fetch(`${preview.baseUrl}/pricing`);
  assert.equal(pricing.status, 200);
  assert.match(await pricing.text(), /Pricing/);

  const aliases = ['/use-cases', '/faq', '/api-reference'];
  for (const alias of aliases) {
    const aliasResponse = await fetch(`${preview.baseUrl}${alias}`, { redirect: 'manual' });
    if (aliasResponse.status >= 300 && aliasResponse.status < 400) {
      assert.equal(aliasResponse.headers.get('location'), '/');
      continue;
    }
    assert.equal(aliasResponse.status, 200);
    const body = await aliasResponse.text();
    assert.match(body, /Redirecting to: \//);
  }
});

test('homepage, meet, and pricing render website content', async () => {
  const homeResponse = await fetch(`${preview.baseUrl}/`);
  assert.equal(homeResponse.status, 200);
  const homeHtml = await homeResponse.text();
  assert.match(homeHtml, /pl-site-page/);
  assert.match(homeHtml, /Ship world-class docs/);
  assert.match(homeHtml, /How Promptless works/);
  assert.match(homeHtml, /Get a demo/);
  assert.doesNotMatch(homeHtml, /Getting Started/i);

  const meetResponse = await fetch(`${preview.baseUrl}/meet`);
  assert.equal(meetResponse.status, 200);
  const meetHtml = await meetResponse.text();
  assert.match(meetHtml, /Book a 15-minute demo/);
  assert.match(meetHtml, /cal-inline-demo-booking/);

  const pricingResponse = await fetch(`${preview.baseUrl}/pricing`);
  assert.equal(pricingResponse.status, 200);
  const pricingHtml = await pricingResponse.text();
  assert.match(pricingHtml, /Pricing/);
  assert.match(pricingHtml, /Startup/);
  assert.match(pricingHtml, /Growth/);
  assert.match(pricingHtml, /Enterprise/);
  assert.match(pricingHtml, /\$500\s*\/\s*mo/);
  assert.match(pricingHtml, /All plans include a 14-day free trial\./);
  assert.match(pricingHtml, /Up to 200 Pages\*/);
  assert.match(pricingHtml, /Pages are normalized/);
  assert.match(pricingHtml, /name=\"growth_bundle\"/);
  assert.match(pricingHtml, /200-500 Pages/);
  assert.match(pricingHtml, /500-1,000 Pages/);
  assert.match(pricingHtml, /1,000-2,000 Pages/);
  assert.match(pricingHtml, /2,000-5,000 Pages/);
  assert.match(pricingHtml, /Slack \+ GitHub integrations/);
  assert.match(pricingHtml, /Open-source, non-commercial project\?/);
  assert.match(pricingHtml, /href=\"https:\/\/promptless\.ai\/docs\/getting-started\/promptless-oss\"/);
  assert.match(pricingHtml, /Book demo/);
  assert.doesNotMatch(pricingHtml, /<h3>Compare plans<\/h3>/);
});

test('website header renders expected CTAs and search control', async () => {
  const response = await fetch(`${preview.baseUrl}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="https:\/\/app\.gopromptless\.ai"[^>]*>\s*Sign in/i);
  assert.match(html, /href="\/meet"[^>]*>\s*Get a demo/i);
  assert.match(html, /href="https:\/\/accounts\.gopromptless\.ai\/sign-up"[^>]*>\s*Start for free/i);
  assert.match(html, /aria-label="Search"/i);
});

test('legal pages render', async () => {
  const privacyResponse = await fetch(`${preview.baseUrl}/privacy`);
  assert.equal(privacyResponse.status, 200);
  const privacyHtml = await privacyResponse.text();
  assert.match(privacyHtml, /Privacy Policy/i);
  assert.match(privacyHtml, /help@gopromptless\.ai/i);

  const termsResponse = await fetch(`${preview.baseUrl}/terms`);
  assert.equal(termsResponse.status, 200);
  const termsHtml = await termsResponse.text();
  assert.match(termsHtml, /Terms of Use/i);
  assert.match(termsHtml, /hello@gopromptless\.ai/i);
});

test('free tool page renders form fields and explanatory copy', async () => {
  const indexResponse = await fetch(`${preview.baseUrl}/free-tools`);
  assert.equal(indexResponse.status, 200);
  const indexHtml = await indexResponse.text();
  assert.match(indexHtml, /Free tools/i);
  assert.match(indexHtml, /Broken Link Report/i);

  const response = await fetch(`${preview.baseUrl}/free-tools/broken-link-report`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Broken Link Report/);
  assert.match(html, /Paste your site URL and email/i);
  assert.match(html, /name="url"/);
  assert.match(html, /name="email"/);
  assert.match(html, /Show advanced options/i);
  assert.match(html, /name="check_external"/);
  assert.match(html, /name="check_anchors"/);
  assert.match(html, /name="max_pages"/);
  assert.doesNotMatch(html, /name="concurrency"/);
  assert.doesNotMatch(html, /name="timeout_seconds"/);
  assert.match(html, /name="website"/);
  assert.match(html, /Send me the report/);

  assert.doesNotMatch(html, /data-website-sidebar="true"/);
});

test('website markdown endpoints are available for agent-friendly content', async () => {
  const routes = [
    { path: '/index.md', heading: /# Automatically update your docs/, detail: /## How Promptless works/ },
    { path: '/pricing.md', heading: /# Pricing that fits teams of all sizes/, detail: /## Startup/ },
    { path: '/free-tools.md', heading: /# Free tools/, detail: /## Broken Link Report/ },
    {
      path: '/free-tools/broken-link-report.md',
      heading: /# Broken Link Report/,
      detail: /## Advanced options/,
    },
  ];

  for (const route of routes) {
    const response = await fetch(`${preview.baseUrl}${route.path}`);
    assert.equal(response.status, 200, `Expected ${route.path} to be available.`);
    assert.match(
      response.headers.get('content-type') ?? '',
      /^text\/markdown\b/i,
      `Expected ${route.path} to return markdown.`
    );

    const body = await response.text();
    assert.match(body, route.heading, `Expected ${route.path} to include its markdown title.`);
    assert.match(body, route.detail, `Expected ${route.path} to include key agent-facing content.`);
  }
});

test('website compatibility routes redirect to canonical destinations', async () => {
  const rootAliases = ['/home', '/use-cases', '/faq', '/api-reference', '/page', '/wtd', '/hn'];
  for (const alias of rootAliases) {
    const response = await fetch(`${preview.baseUrl}${alias}`, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      assert.equal(response.headers.get('location'), '/');
      continue;
    }
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /Redirecting to: \//);
  }
});

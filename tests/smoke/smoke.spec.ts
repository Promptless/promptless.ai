import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { startPreviewServer, type PreviewServer } from './preview-server';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const legacyRoutes = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'tests', 'fixtures', 'pre-product-split-routes.json'), 'utf8')
) as {
  sourceCommit: string;
  forDocsHtml: string[];
  markdownAndOpenGraphExcluded: string[];
  utilityHtml: string[];
  apiHtml: string[];
};

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

function assertMenuState(navHtml: string, label: string, active: boolean) {
  const pattern = new RegExp(
    `<summary(?=[^>]*class="[^"]*\\bactive\\b[^"]*")[^>]*>[\\s\\S]*?${escapeRegExp(
      label
    )}[\\s\\S]*?<\\/summary>`,
    'i'
  );
  if (active) {
    assert.match(navHtml, pattern, `Expected ${label} menu to be active.`);
  } else {
    assert.doesNotMatch(navHtml, pattern, `Did not expect ${label} menu to be active.`);
  }
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

function getBuiltHtmlFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    if (statSync(filePath).isDirectory()) return getBuiltHtmlFiles(filePath);
    return entry.endsWith('.html') ? [filePath] : [];
  });
}

function routeForBuiltHtml(staticRoot: string, filePath: string): string {
  const relative = path.relative(staticRoot, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
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
  assert.equal(changelogBackLinks.length, 1, 'Expected a changelog back link.');
});

test('pages reference versioned pre-generated Open Graph images', async () => {
  const pricingResponse = await fetch(`${preview.baseUrl}/pricing`);
  assert.equal(pricingResponse.status, 200);
  const pricingHtml = await pricingResponse.text();
  const ogImageUrl = pricingHtml.match(
    /<meta property="og:image" content="([^"]+)"/i
  )?.[1];

  assert.ok(ogImageUrl, 'Expected pricing to declare an Open Graph image.');
  assert.match(ogImageUrl, /^https:\/\/promptless\.ai\/og\/pricing\.png\?v=[a-f0-9]{16}$/);
  assert.match(
    pricingHtml,
    new RegExp(`<meta name="twitter:image" content="${escapeRegExp(ogImageUrl)}"`, 'i')
  );

  const generatedImage = await fetch(`${preview.baseUrl}${new URL(ogImageUrl).pathname}`);
  assert.equal(generatedImage.status, 200);
  assert.equal(generatedImage.headers.get('content-type'), 'image/png');

  // Hand-authored social images continue to take precedence and do not produce
  // an unused generated card.
  const explicitImagePost = await fetch(`${preview.baseUrl}/blog/technical/agent-docs`);
  assert.equal(explicitImagePost.status, 200);
  assert.match(
    await explicitImagePost.text(),
    /<meta property="og:image" content="https:\/\/promptless\.ai\/assets\/agent-docs-social\.png"/i
  );
  const unusedGeneratedImage = await fetch(`${preview.baseUrl}/og/blog/technical/agent-docs.png`);
  assert.equal(unusedGeneratedImage.status, 404);
});

test('llms endpoints remain available', async () => {
  // Generated by the starlight-llms-txt plugin (Starport Phase 6, ADR 0004 §4),
  // which superseded the hand-rolled src/pages/llms*.txt.ts endpoints. The index
  // links the abridged/complete sets and the reconciled non-docs optionalLinks;
  // llms-full.txt carries the full docs content behind a <SYSTEM> preamble.
  const llms = await fetch(`${preview.baseUrl}/llms.txt`);
  assert.equal(llms.status, 200);
  const llmsBody = await llms.text();
  assert.match(llmsBody, /# Promptless/i);
  assert.match(llmsBody, /\/llms-full\.txt/i);
  assert.match(llmsBody, /\/llms-small\.txt/i);
  assert.match(llmsBody, /\/blog/i);
  assert.match(llmsBody, /\/changelog/i);

  const llmsFull = await fetch(`${preview.baseUrl}/llms-full.txt`);
  assert.equal(llmsFull.status, 200);
  const llmsFullBody = await llmsFull.text();
  assert.match(llmsFullBody, /<SYSTEM>/i);
  assert.match(llmsFullBody, /Promptless/i);
  assert.match(llmsFullBody, /# Promptless overview/i);
  assert.match(llmsFullBody, /# Promptless for Agent Instructions/i);
  assert.match(llmsFullBody, /\/docs\/for-docs\//i);

  const llmsSmall = await fetch(`${preview.baseUrl}/llms-small.txt`);
  assert.equal(llmsSmall.status, 200);
  const llmsSmallBody = await llmsSmall.text();
  assert.match(llmsSmallBody, /Promptless/i);
});

test('homepage and docs pages include the llms.txt directive in html', async () => {
  const homepage = await fetch(`${preview.baseUrl}/`);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /href="\/llms\.txt"[^>]*>llms\.txt<\/a>/i);

  const docsPage = await fetch(`${preview.baseUrl}/docs/for-docs/start-here/welcome`);
  assert.equal(docsPage.status, 200);
  assert.match(await docsPage.text(), /href="\/llms\.txt"[^>]*>llms\.txt<\/a>/i);
});

test('website and docs pages render in permanent dark mode', async () => {
  for (const route of ['/', '/docs/for-docs/start-here/welcome']) {
    const response = await fetch(`${preview.baseUrl}${route}`);
    assert.equal(response.status, 200);
    const html = await response.text();

    assert.match(html, /<html[^>]*data-theme="dark"/i);
    assert.match(html, /localStorage\.setItem\('starlight-theme', 'dark'\)/);
    assert.doesNotMatch(html, /<starlight-theme-select\b/i);
  }
});

test('primary nav keeps canonical routes with free tools tab', async () => {
  const response = await fetch(`${preview.baseUrl}/docs/for-docs/start-here/welcome`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const nav = getPrimaryNav(html);

  assertLink(nav, '/', 'Home');
  assertLink(nav, '/pricing', 'Pricing');
  assert.match(nav, /<summary[^>]*aria-label="Choose a documentation product"[^>]*>/i);
  assertLink(nav, '/docs/for-docs/start-here/welcome', 'Promptless for Docs');
  assertLink(nav, '/docs/governance', 'Promptless for Agent Instructions');
  assert.match(nav, /class="pl-docs-product-badge">New<\/span>/i);
  assertLink(nav, '/blog', 'Blog');
  assertLink(nav, '/changelog', 'Changelog');
  assertLink(nav, '/free-tools', 'Free tools');

  assertLabelOrder(nav, ['Home', 'Pricing', 'Docs', 'Blog', 'Changelog', 'Free tools']);
  assert.doesNotMatch(nav, /href="\/blog\/all"/);
  assert.doesNotMatch(nav, /href="\/changelog\/all"/);
});

test('website/docs/blog/changelog/free tools active state is correct', async () => {
  const websiteHtml = await (await fetch(`${preview.baseUrl}/`)).text();
  const websitePricingHtml = await (await fetch(`${preview.baseUrl}/pricing`)).text();
  const meetHtml = await (await fetch(`${preview.baseUrl}/meet`)).text();
  const docsHtml = await (await fetch(`${preview.baseUrl}/docs/for-docs/start-here/welcome`)).text();
  const blogHtml = await (await fetch(`${preview.baseUrl}/blog`)).text();
  const changelogHtml = await (await fetch(`${preview.baseUrl}/changelog`)).text();
  const freeToolsIndexHtml = await (await fetch(`${preview.baseUrl}/free-tools`)).text();
  const freeToolsToolHtml = await (await fetch(`${preview.baseUrl}/free-tools/broken-link-report`)).text();

  const websiteNav = getPrimaryNav(websiteHtml);
  assertActiveLink(websiteNav, '/', 'Home');
  assertMenuState(websiteNav, 'Docs', false);
  assertInactiveLink(websiteNav, '/blog', 'Blog');
  assertInactiveLink(websiteNav, '/changelog', 'Changelog');
  assertInactiveLink(websiteNav, '/free-tools', 'Free tools');

  const pricingNav = getPrimaryNav(websitePricingHtml);
  assertActiveLink(pricingNav, '/pricing', 'Pricing');
  assertInactiveLink(pricingNav, '/', 'Home');

  const meetNav = getPrimaryNav(meetHtml);
  assertInactiveLink(meetNav, '/', 'Home');

  const docsNav = getPrimaryNav(docsHtml);
  assertMenuState(docsNav, 'Docs', true);
  assertInactiveLink(docsNav, '/', 'Home');
  assertInactiveLink(docsNav, '/blog', 'Blog');
  assertInactiveLink(docsNav, '/changelog', 'Changelog');
  assertInactiveLink(docsNav, '/free-tools', 'Free tools');

  const blogNav = getPrimaryNav(blogHtml);
  assertActiveLink(blogNav, '/blog', 'Blog');
  assertInactiveLink(blogNav, '/', 'Home');
  assertMenuState(blogNav, 'Docs', false);
  assertInactiveLink(blogNav, '/changelog', 'Changelog');
  assertInactiveLink(blogNav, '/free-tools', 'Free tools');

  const changelogNav = getPrimaryNav(changelogHtml);
  assertActiveLink(changelogNav, '/changelog', 'Changelog');
  assertInactiveLink(changelogNav, '/', 'Home');
  assertMenuState(changelogNav, 'Docs', false);
  assertInactiveLink(changelogNav, '/blog', 'Blog');
  assertInactiveLink(changelogNav, '/free-tools', 'Free tools');

  const freeToolsIndexNav = getPrimaryNav(freeToolsIndexHtml);
  assertActiveLink(freeToolsIndexNav, '/free-tools', 'Free tools');
  assertInactiveLink(freeToolsIndexNav, '/', 'Home');
  assertMenuState(freeToolsIndexNav, 'Docs', false);
  assertInactiveLink(freeToolsIndexNav, '/blog', 'Blog');
  assertInactiveLink(freeToolsIndexNav, '/changelog', 'Changelog');

  const freeToolsToolNav = getPrimaryNav(freeToolsToolHtml);
  assertActiveLink(freeToolsToolNav, '/free-tools', 'Free tools');
  assertInactiveLink(freeToolsToolNav, '/', 'Home');
  assertMenuState(freeToolsToolNav, 'Docs', false);
  assertInactiveLink(freeToolsToolNav, '/blog', 'Blog');
  assertInactiveLink(freeToolsToolNav, '/changelog', 'Changelog');
});

test('each documentation product gets only its own active topic and product metadata', async () => {
  const forDocsResponse = await fetch(`${preview.baseUrl}/docs/for-docs/start-here/welcome`);
  assert.equal(forDocsResponse.status, 200);
  const forDocsHtml = await forDocsResponse.text();

  assert.match(forDocsHtml, /class="pl-docs-product-switcher[\s"]/);
  assert.match(
    forDocsHtml,
    /<a(?=[^>]*class="[^"]*pl-docs-product-switcher-option active)(?=[^>]*href="\/docs\/for-docs\/start-here\/welcome")(?=[^>]*aria-current="true")[^>]*>/i
  );
  assert.match(forDocsHtml, /href="\/docs\/for-docs\/start-here\/welcome\/" aria-current="page"/i);
  assert.doesNotMatch(forDocsHtml, /href="\/docs\/governance\/" aria-current="page"/i);

  const governanceResponse = await fetch(`${preview.baseUrl}/docs/governance`);
  assert.equal(governanceResponse.status, 200);
  const governanceHtml = await governanceResponse.text();

  assert.match(
    governanceHtml,
    /<a(?=[^>]*class="[^"]*pl-docs-product-switcher-option active)(?=[^>]*href="\/docs\/governance")(?=[^>]*aria-current="true")[^>]*>/i
  );
  assert.match(governanceHtml, /href="\/docs\/governance\/" aria-current="page"/i);
  assert.doesNotMatch(
    governanceHtml,
    /href="\/docs\/for-docs\/start-here\/welcome\/" aria-current="page"/i
  );
  assert.match(governanceHtml, /<h1[^>]*>Promptless for Agent Instructions<\/h1>/i);
  assert.match(
    governanceHtml,
    /uses evidence from agent sessions to help teams improve and govern skills, subagents, hooks, and other agent instructions\./i
  );
  assert.match(governanceHtml, /Detailed documentation is coming soon\./i);

  for (const location of ['nav', 'mobile_menu', 'docs_sidebar', 'footer']) {
    assert.match(
      governanceHtml,
      new RegExp(`data-track-action="select_docs_product"[\\s\\S]{0,220}data-track-location="${location}"`),
      `Expected product selection tracking in ${location}.`
    );
  }
});

test('Docs disclosures expose keyboard and dismissal behavior', async () => {
  const response = await fetch(`${preview.baseUrl}/docs/governance`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<details class="pl-site-tab-menu" data-site-nav-disclosure>/i);
  assert.match(html, /document\.addEventListener\('click'/);
  assert.match(html, /event\.key !== 'Escape'/);
  assert.match(html, /restoreFocus/);
  assert.match(html, /document\.addEventListener\('toggle'/);
  assert.match(html, /typeof window\.posthog\?\.capture === 'function'/);
});

test('utility documentation pages stay outside product sidebars', async () => {
  for (const route of legacyRoutes.utilityHtml) {
    const response = await fetch(`${preview.baseUrl}${route}`);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.doesNotMatch(html, /class="pl-docs-product-switcher[\s"]/i, route);
    assert.doesNotMatch(html, /<ul class="top-level[^>]*>/i, route);
    assert.match(html, /\.page > \.sidebar\s*\{\s*display: none !important;/i, route);
  }
});

test('the frozen pre-split route inventory redirects once to successful canonical routes', async () => {
  assert.equal(
    legacyRoutes.sourceCommit,
    '3981b325de50c2a2ad83edcf70816b70f2300afa',
    'The compatibility fixture must stay tied to the fetched migration base.'
  );

  const excluded = new Set(legacyRoutes.markdownAndOpenGraphExcluded);
  const cases: Array<{ source: string; destination: string }> = [];

  for (const source of legacyRoutes.forDocsHtml) {
    const destination = `/docs/for-docs${source.slice('/docs'.length)}`;
    cases.push({ source, destination });
    if (!excluded.has(source)) {
      cases.push({ source: `${source}.md`, destination: `${destination}.md` });
      cases.push({
        source: `/og${source}.png`,
        destination: `/og/docs/for-docs${source.slice('/docs'.length)}.png`,
      });
    }
  }

  for (const source of legacyRoutes.apiHtml) {
    cases.push({ source, destination: `/docs/for-docs/api${source.slice('/api'.length)}` });
  }

  const batches: Array<typeof cases> = [];
  for (let index = 0; index < cases.length; index += 20) {
    batches.push(cases.slice(index, index + 20));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async ({ source, destination }) => {
        const response = await fetch(`${preview.baseUrl}${source}`, { redirect: 'manual' });
        let location: string | undefined;

        if (response.status >= 300 && response.status < 400) {
          assert.ok([301, 308].includes(response.status), `${source} was not a permanent redirect.`);
          const header = response.headers.get('location');
          assert.ok(header, `${source} did not provide a Location header.`);
          location = new URL(header, preview.baseUrl).pathname;
        } else {
          assert.equal(response.status, 200, `${source} did not render a static redirect stub.`);
          location = (await response.text()).match(/Redirecting to:\s*([^\s<"']+)/)?.[1];
        }

        assert.equal(location, destination, `${source} must redirect directly to its canonical route.`);
        const canonical = await fetch(`${preview.baseUrl}${destination}`, { redirect: 'manual' });
        assert.equal(canonical.status, 200, `${destination} must be a successful canonical destination.`);
      })
    );
  }
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

  // Alias → canonical destination (see the `redirects` map in astro.config.mjs;
  // /api-reference points at the API reference, not the homepage).
  const aliases: Record<string, string> = { '/use-cases': '/', '/faq': '/', '/api-reference': '/docs/for-docs/api/' };
  for (const [alias, destination] of Object.entries(aliases)) {
    const aliasResponse = await fetch(`${preview.baseUrl}${alias}`, { redirect: 'manual' });
    if (aliasResponse.status >= 300 && aliasResponse.status < 400) {
      assert.equal(aliasResponse.headers.get('location'), destination, `Alias ${alias}`);
      continue;
    }
    assert.equal(aliasResponse.status, 200);
    const body = await aliasResponse.text();
    assert.match(body, new RegExp(`Redirecting to: ${escapeRegExp(destination)}`), `Alias ${alias}`);
  }
});

test('homepage product switcher renders accessible default state and product regions', async () => {
  const homeResponse = await fetch(`${preview.baseUrl}/`);
  assert.equal(homeResponse.status, 200);
  const homeHtml = await homeResponse.text();
  assert.match(homeHtml, /pl-site-page/);

  // Both product tabs and panels are server-rendered. Assert their accessible
  // relationships and initial state without treating marketing copy as a contract.
  assert.match(homeHtml, /role="tablist"/);
  assert.match(
    homeHtml,
    /<button(?=[^>]*id="pl-product-switcher-tab-agents")(?=[^>]*role="tab")(?=[^>]*aria-selected="true")(?=[^>]*aria-controls="pl-hero-panel-agents")[^>]*>/
  );
  assert.match(
    homeHtml,
    /<button(?=[^>]*id="pl-product-switcher-tab-docs")(?=[^>]*role="tab")(?=[^>]*aria-selected="false")(?=[^>]*aria-controls="pl-hero-panel-docs")[^>]*>/
  );
  assert.match(
    homeHtml,
    /<div(?=[^>]*id="pl-hero-panel-agents")(?=[^>]*role="tabpanel")(?=[^>]*aria-labelledby="pl-product-switcher-tab-agents")(?![^>]*\shidden)[^>]*>/
  );
  assert.match(
    homeHtml,
    /<div(?=[^>]*id="pl-hero-panel-docs")(?=[^>]*role="tabpanel")(?=[^>]*aria-labelledby="pl-product-switcher-tab-docs")(?=[^>]*\shidden)[^>]*>/
  );

  // Supporting regions follow the default-active product on the server. The
  // smoke harness does not execute the client-side tab-switching JavaScript.
  assert.match(homeHtml, /<div(?=[^>]*id="pl-below-fold-docs")(?=[^>]*\shidden)[^>]*>/);
  assert.doesNotMatch(homeHtml, /<div(?=[^>]*id="pl-below-fold-agents")(?=[^>]*\shidden)[^>]*>/);
  assert.match(
    homeHtml,
    /<div(?=[^>]*id="pl-hero-aside-agents")(?=[^>]*role="group")(?=[^>]*aria-labelledby="pl-product-switcher-tab-agents")(?![^>]*\shidden)[^>]*>/
  );
  assert.match(
    homeHtml,
    /<div(?=[^>]*id="pl-hero-aside-docs")(?=[^>]*role="group")(?=[^>]*aria-labelledby="pl-product-switcher-tab-docs")(?=[^>]*\shidden)[^>]*>/
  );
  assert.match(homeHtml, /class="pl-testimonials-vertical[\s"]/);
  assert.match(homeHtml, /class="pl-mobile-testimonials[\s"]/);

  // Keep the regression coverage that product-specific content stays inside the
  // correct region, using structural hooks instead of sentences or brand names.
  const agentsAsideIndex = homeHtml.indexOf('id="pl-hero-aside-agents"');
  const docsAsideIndex = homeHtml.indexOf('id="pl-hero-aside-docs"');
  const statCardsIndex = homeHtml.indexOf('class="pl-stat-cards');
  const agentLogoCarouselIndex = homeHtml.indexOf('data-customer-logo-carousel="agents"');
  const verticalTestimonialsIndex = homeHtml.indexOf('class="pl-testimonials-vertical');
  assert.ok(
    agentsAsideIndex !== -1 && statCardsIndex > agentsAsideIndex && statCardsIndex < docsAsideIndex,
    'Expected .pl-stat-cards to render inside #pl-hero-aside-agents, before #pl-hero-aside-docs.'
  );
  assert.ok(
    agentLogoCarouselIndex > statCardsIndex && agentLogoCarouselIndex < docsAsideIndex,
    'Expected the agents customer-logo carousel directly after the stat cards, inside #pl-hero-aside-agents.'
  );
  assert.ok(
    docsAsideIndex !== -1 && verticalTestimonialsIndex > docsAsideIndex,
    'Expected .pl-testimonials-vertical to render inside #pl-hero-aside-docs.'
  );

  // The section and analytics hooks are the stable contract for the complete
  // agent story. Its prose and figures can now change without changing this test.
  assert.match(homeHtml, /data-track-location="agent_governance_midpage"/);
  assert.match(homeHtml, /data-track-location="agent_governance_footer"/);
  for (const section of [
    'agent-differentiation',
    'agent-impact-examples',
    'agent-mid-cta',
    'agent-learning-loop',
    'agent-governance',
    'agent-faq',
    'agent-final-cta',
  ]) {
    assert.match(homeHtml, new RegExp(`data-section-tracked="${section}"`));
  }

  assert.equal(homeHtml.match(/class="pl-stat-card[\s"]/g)?.length, 4);
  assert.equal(homeHtml.match(/aria-label="\d+ percent (?:increase|decrease)"/g)?.length, 4);
  assert.equal(homeHtml.match(/data-customer-logo-carousel="(?:agents|docs)"/g)?.length, 2);

  const docsBelowFoldIndex = homeHtml.indexOf('id="pl-below-fold-docs"');
  const docsLogoCarouselIndex = homeHtml.indexOf('data-customer-logo-carousel="docs"');
  const docsVideoIndex = homeHtml.indexOf('data-video-id="');
  assert.ok(
    docsBelowFoldIndex !== -1 &&
      docsLogoCarouselIndex > docsBelowFoldIndex &&
      docsVideoIndex > docsLogoCarouselIndex,
    'Expected the docs customer-logo carousel above the docs demo video.'
  );
  assert.match(homeHtml, /data-video-id="[A-Za-z0-9_-]+"/);
  assert.match(homeHtml, /pl-hero-v2-toolchain-agents/);
  assert.match(homeHtml, /id="book-a-demo"/);
  assert.match(homeHtml, /id="book-a-demo-docs"/);
  assert.match(homeHtml, /data-track-action="ask_ai"/);
  assert.match(homeHtml, /data-track-location="homepage_ask_ai"/);
});

test('meet page renders the booking embed', async () => {
  const meetResponse = await fetch(`${preview.baseUrl}/meet`);
  assert.equal(meetResponse.status, 200);
  const meetHtml = await meetResponse.text();
  assert.match(meetHtml, /cal-inline-demo-booking/);
});

test('pricing renders accessible default state and plan structure', async () => {
  const pricingResponse = await fetch(`${preview.baseUrl}/pricing`);
  assert.equal(pricingResponse.status, 200);
  const pricingHtml = await pricingResponse.text();

  assert.match(pricingHtml, /role="tablist"/);
  assert.match(
    pricingHtml,
    /<button(?=[^>]*id="pl-pricing-tab-docs")(?=[^>]*role="tab")(?=[^>]*aria-selected="true")(?=[^>]*aria-controls="pl-pricing-panel-docs")[^>]*>/
  );
  assert.match(
    pricingHtml,
    /<button(?=[^>]*id="pl-pricing-tab-agents")(?=[^>]*role="tab")(?=[^>]*aria-selected="false")(?=[^>]*aria-controls="pl-pricing-panel-agents")[^>]*>/
  );
  assert.match(
    pricingHtml,
    /<div(?=[^>]*id="pl-pricing-panel-agents")(?=[^>]*role="tabpanel")(?=[^>]*aria-labelledby="pl-pricing-tab-agents")(?=[^>]*\shidden)[^>]*>/
  );
  assert.match(
    pricingHtml,
    /<div(?=[^>]*id="pl-pricing-panel-docs")(?=[^>]*role="tabpanel")(?=[^>]*aria-labelledby="pl-pricing-tab-docs")(?![^>]*\shidden)[^>]*>/
  );

  for (const plan of ['startup', 'growth', 'enterprise']) {
    assert.equal(
      pricingHtml.match(new RegExp(`<article(?=[^>]*data-plan="${plan}")[^>]*>`, 'g'))?.length,
      2,
      `Expected one ${plan} card in each pricing panel.`
    );
    assert.equal(
      pricingHtml.match(new RegExp(`<a(?=[^>]*data-track-location="pricing_${plan}")[^>]*>`, 'g'))?.length,
      2,
      `Expected each ${plan} card to retain its tracked CTA.`
    );
  }
  assert.match(pricingHtml, /name="growth_bundle"/);
  assert.match(pricingHtml, /data-growth-price/);
});

test('every same-origin docs link on the homepage resolves to a real page', async (t) => {
  // The smoke harness is the right layer for this. preview-server.ts replays the
  // Vercel redirect routes from .vercel/output/config.json as real 3xx responses
  // (loadRedirectRoutes), so an adapter build reproduces production's exact-match,
  // trailing-slash-sensitive redirect behavior. That is what the authored hero
  // hrefs tripped over: a redirect source without a trailing slash never matches
  // an href that has one. A static build carries no redirect routes at all
  // (resolveBuildOutput returns `redirects: []`), so the exact-match guarantee
  // holds only under the adapter build — see the stub note in resolveHref below.
  const homepage = await fetch(`${preview.baseUrl}/`);
  assert.equal(homepage.status, 200);
  const html = await homepage.text();

  const previewOrigin = new URL(preview.baseUrl).origin;
  const MAX_HOPS = 5;

  // Collect same-site docs hrefs in both authored forms: root-relative (/docs…)
  // and origin-prefixed (https://promptless.ai/docs…). Absolute hrefs are
  // normalized to their pathname so every request below goes to the preview
  // server — this test must never reach promptless.ai, or a link broken on this
  // branch would pass against production.
  const hrefs = new Set<string>();
  for (const [, value] of html.matchAll(/href="([^"]*)"/g)) {
    const isAbsolute = /^https:\/\/promptless\.ai\/docs(?:[/?#]|$)/.test(value);
    if (!isAbsolute && !/^\/docs(?:[/?#]|$)/.test(value)) continue;
    const pathname = isAbsolute ? new URL(value).pathname : value;
    hrefs.add(pathname.replace(/#.*$/, ''));
  }

  // Vacuity guard: a refactor that drops the hero must fail here instead of
  // passing an empty loop.
  assert.ok(
    hrefs.size >= 10,
    `Homepage rendered fewer docs links than expected (found ${hrefs.size}, expected at least 10).`
  );

  type Resolution =
    | { kind: 'final'; status: number; chain: string[] }
    | { kind: 'off-origin'; location: string; chain: string[] };

  async function resolveHref(href: string): Promise<Resolution> {
    const chain: string[] = [href];
    const visited = new Set<string>();
    let current = new URL(href, preview.baseUrl);
    let hops = 0;

    for (;;) {
      assert.ok(
        !visited.has(current.href),
        `Redirect loop for ${href} (chain: ${chain.join(' -> ')}).`
      );
      visited.add(current.href);
      assert.ok(
        hops <= MAX_HOPS,
        `${href} exceeded ${MAX_HOPS} redirect hops (chain: ${chain.join(' -> ')}).`
      );
      hops += 1;

      const response = await fetch(current, { redirect: 'manual' });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        assert.ok(
          location,
          `${href} returned ${response.status} with no Location header (chain: ${chain.join(' -> ')}).`
        );
        const next = new URL(location, current);
        // loadRedirectRoutes replays each Vercel route without its `has`
        // conditions, so a host-conditional rule could in principle surface an
        // absolute production Location. Never fetch off-origin from a smoke test:
        // report it as unverifiable rather than asserting on production.
        if (next.origin !== previewOrigin) return { kind: 'off-origin', location: next.href, chain };
        chain.push(next.pathname);
        current = next;
        continue;
      }

      if (response.status === 200) {
        // Static builds (MCP_ENABLED=false → dist) have no platform redirects:
        // Astro emits a "Redirecting to: …" stub page with a 200 instead, as the
        // /blog/all and website-alias tests above allow for. Follow the stub so
        // the dist path keeps real coverage instead of accepting the stub itself.
        // The trade-off: on a trailing-slash mismatch the directory-level stub
        // answers 200 on its own, so following it cannot tell a correctly slashed
        // href from one that only resolves because the stub bridges the mismatch.
        // The exact-match assertion is therefore only real under the adapter
        // build, which is what CI's check.yml runs.
        const stubTarget = (await response.text()).match(/Redirecting to:\s*([^\s<"']+)/)?.[1];
        if (stubTarget) {
          const next = new URL(stubTarget, current);
          if (next.origin !== previewOrigin) return { kind: 'off-origin', location: next.href, chain };
          chain.push(next.pathname);
          current = next;
          continue;
        }
      }

      return { kind: 'final', status: response.status, chain };
    }
  }

  let verified = 0;
  for (const href of [...hrefs].sort()) {
    const resolution = await resolveHref(href);
    if (resolution.kind === 'off-origin') {
      t.diagnostic(
        `${href} redirects off-origin to ${resolution.location}; not locally verifiable (chain: ${resolution.chain.join(' -> ')}).`
      );
      continue;
    }
    assert.equal(
      resolution.status,
      200,
      `Homepage docs link ${href} resolved to ${resolution.status}, expected 200 (chain: ${resolution.chain.join(' -> ')}).`
    );
    verified += 1;
  }

  // Off-origin hops above are reported, not asserted on. This keeps that escape
  // hatch from turning the whole test into diagnostics-only coverage.
  assert.ok(
    verified >= 10,
    `Only ${verified} of ${hrefs.size} homepage docs links were verified against the preview server; expected at least 10.`
  );
});

test('every link to a built same-origin page resolves successfully', async () => {
  const staticRoot = existsSync(path.join(REPO_ROOT, '.vercel', 'output', 'static'))
    ? path.join(REPO_ROOT, '.vercel', 'output', 'static')
    : path.join(REPO_ROOT, 'dist');
  const targets = new Map<string, string>();

  for (const filePath of getBuiltHtmlFiles(staticRoot)) {
    const sourceRoute = routeForBuiltHtml(staticRoot, filePath);
    const html = readFileSync(filePath, 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const href = match[1].replaceAll('&amp;', '&');
      if (href.startsWith('#')) continue;

      const target = new URL(href, `https://promptless.ai${sourceRoute}`);
      if (target.origin !== 'https://promptless.ai' || target.pathname === '/mcp') continue;
      targets.set(`${target.pathname}${target.search}`, sourceRoute);
    }
  }

  const entries = [...targets.entries()];
  const broken: string[] = [];
  for (let index = 0; index < entries.length; index += 30) {
    await Promise.all(
      entries.slice(index, index + 30).map(async ([target, source]) => {
        const response = await fetch(`${preview.baseUrl}${target}`);
        if (response.status !== 200) {
          broken.push(`${source} -> ${target} (${response.status})`);
        }
      })
    );
  }
  assert.deepEqual(broken.sort(), [], `Broken same-origin links:\n${broken.sort().join('\n')}`);
});

test('website header replaces home search with the launch announcement', async () => {
  const homeResponse = await fetch(`${preview.baseUrl}/`);
  assert.equal(homeResponse.status, 200);
  const homeHtml = await homeResponse.text();
  assert.match(homeHtml, /<a(?=[^>]*href="https:\/\/app\.gopromptless\.ai")[^>]*>/i);
  assert.match(homeHtml, /<a(?=[^>]*href="\/meet")[^>]*>/i);
  assert.match(homeHtml, /<a(?=[^>]*href="https:\/\/accounts\.gopromptless\.ai\/sign-up")[^>]*>/i);
  assert.match(
    homeHtml,
    /href="\/blog\/product-updates\/introducing-promptless-for-agent-instructions"/i
  );
  assert.doesNotMatch(homeHtml, /aria-label="Search"/i);

  const docsResponse = await fetch(`${preview.baseUrl}/docs/for-docs/start-here/welcome`);
  assert.equal(docsResponse.status, 200);
  assert.match(await docsResponse.text(), /aria-label="Search"/i);
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

test('free tool page renders its link and form contract', async () => {
  const indexResponse = await fetch(`${preview.baseUrl}/free-tools`);
  assert.equal(indexResponse.status, 200);
  const indexHtml = await indexResponse.text();
  assert.match(indexHtml, /href="\/free-tools\/broken-link-report"/);

  const response = await fetch(`${preview.baseUrl}/free-tools/broken-link-report`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /id="broken-link-report-form"/);
  assert.match(html, /name="url"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="check_external"/);
  assert.match(html, /name="check_anchors"/);
  assert.match(html, /name="max_pages"/);
  assert.doesNotMatch(html, /name="concurrency"/);
  assert.doesNotMatch(html, /name="timeout_seconds"/);
  assert.match(html, /name="website"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*>/);
  assert.match(html, /aria-live="polite"/);

  assert.doesNotMatch(html, /data-website-sidebar="true"/);
});

test('website markdown endpoints are available for agent-friendly content', async () => {
  const routes = [
    '/index.md',
    '/pricing.md',
    '/free-tools.md',
    '/free-tools/broken-link-report.md',
  ];

  for (const route of routes) {
    const response = await fetch(`${preview.baseUrl}${route}`);
    assert.equal(response.status, 200, `Expected ${route} to be available.`);
    assert.match(
      response.headers.get('content-type') ?? '',
      /^text\/markdown\b/i,
      `Expected ${route} to return markdown.`
    );

    const body = await response.text();
    assert.match(body, /^# \S.+/m, `Expected ${route} to include a title.`);
    assert.match(body, /^## \S.+/m, `Expected ${route} to include structured content.`);
    assert.match(body, /\[llms\.txt\]\(\/llms\.txt\)/, `Expected ${route} to link to the docs index.`);
    assert.ok(body.length > 100, `Expected ${route} to include substantive content.`);
  }
});

test('website compatibility routes redirect to canonical destinations', async () => {
  // Alias → canonical destination (see the `redirects` map in astro.config.mjs).
  const rootAliases: Record<string, string> = {
    '/home': '/',
    '/docs': '/docs/for-docs/start-here/welcome',
    '/oss': '/docs/for-docs/start-here/open-source-quickstart',
    '/use-cases': '/',
    '/faq': '/',
    '/api-reference': '/docs/for-docs/api/',
    '/page': '/',
    '/wtd': '/',
    '/hn': '/',
  };
  for (const [alias, destination] of Object.entries(rootAliases)) {
    const response = await fetch(`${preview.baseUrl}${alias}`, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      assert.equal(response.headers.get('location'), destination, `Alias ${alias}`);
      continue;
    }
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, new RegExp(`Redirecting to: ${escapeRegExp(destination)}`), `Alias ${alias}`);
  }
});

test('adapter build wires the /mcp route to the render function (ADR 0007)', (t) => {
  // Only meaningful for adapter builds; MCP_ENABLED=false static builds have no
  // serverless function by design.
  const configPath = path.join(REPO_ROOT, '.vercel', 'output', 'config.json');
  if (!existsSync(configPath)) {
    t.skip('No .vercel/output/config.json — static (MCP_ENABLED=false) build.');
    return;
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    routes?: Array<{ src?: string; dest?: string }>;
  };
  const mcpRoute = (config.routes ?? []).find(
    (route) => route.src && route.dest && new RegExp(route.src).test('/mcp')
  );
  assert.ok(mcpRoute, 'Expected a config.json route mapping /mcp to a function.');
  assert.ok(
    existsSync(path.join(REPO_ROOT, '.vercel', 'output', 'functions', `${mcpRoute.dest}.func`)),
    `Expected the ${mcpRoute.dest} serverless function to exist in the build output.`
  );
});

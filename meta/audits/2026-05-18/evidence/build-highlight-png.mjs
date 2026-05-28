#!/usr/bin/env node
/**
 * Slack-shareable highlights PNG from report.html.
 *
 * Launches headless Chromium via Playwright, opens the local report.html,
 * hides the TOC sidebar + downstream sections (process, findings detail,
 * page-data, lens reports, recommendations, reusable, appendix), then
 * screenshots the headline view: header banner + at-a-glance dashboard.
 *
 * Output: meta/audits/2026-05-18/report-highlights.png
 *
 * Run from the promptless.ai repo root:
 *   node meta/audits/2026-05-18/evidence/build-highlight-png.mjs
 */
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const AUDIT_DIR = resolve(import.meta.dirname, '..');
const REPORT = resolve(AUDIT_DIR, 'report.html');
const OUT_PNG = resolve(AUDIT_DIR, 'report-highlights.png');
const URL = `file://${REPORT}`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2, // retina-quality
});
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

// Inject CSS that:
//  - Hides the TOC sidebar (it's irrelevant in a static image)
//  - Hides every section below the dashboard (highlights only)
//  - Expands the layout to use the full viewport
//  - Removes scrollbar gutter / decorations
//  - Tightens the count grid for a denser composition
await page.addStyleTag({
  content: `
    .sidebar { display: none !important; }
    .layout { grid-template-columns: 1fr !important; max-width: 1400px !important; margin: 0 auto !important; }
    main { padding: 24px 48px 32px !important; }
    /* Hide everything except the dashboard + header banner */
    #executive-summary, #framework, #process, #findings, #page-data,
    #lens-reports, #recommendations, #reusable, #appendix { display: none !important; }
    /* Dashboard tweaks for Slack composition */
    #dashboard h2 { margin-top: 0 !important; }
    #dashboard { padding-bottom: 0 !important; }
    /* Hide the lens scoreboard's long-form notes column to keep the composition tight */
    #lens-table .notes-cell { display: none; }
    #lens-table th:nth-child(9) { display: none; }
    /* Larger count numbers for visual punch */
    .count-num { font-size: 2.1rem !important; }
    .count-card { padding: 14px !important; }
    /* Strip the "Click a column header / lens to jump" hint — irrelevant in static image */
    .hint { display: none !important; }
    /* Promo: subtle footer note for Slack context */
    #dashboard::after {
      content: "Full interactive report → promptless.ai/meta/audits/2026-05-18/report.html";
      display: block;
      margin-top: 28px;
      padding: 14px 18px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #6b7280;
      font-size: 0.9rem;
      font-style: italic;
      text-align: center;
    }
  `,
});

// Wait one paint cycle for layout to settle
await page.waitForTimeout(200);

// Measure the composition: from the top of <html> to the bottom of the dashboard
const totalHeight = await page.evaluate(() => {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return document.documentElement.scrollHeight;
  const r = dashboard.getBoundingClientRect();
  return Math.ceil(r.bottom + window.scrollY + 32); // +32px breathing room
});

// Resize the viewport to fit the full composition + take the screenshot
await page.setViewportSize({ width: 1440, height: totalHeight });
await page.waitForTimeout(100);

await page.screenshot({
  path: OUT_PNG,
  fullPage: false,
  clip: { x: 0, y: 0, width: 1440, height: totalHeight },
});

await browser.close();

const fs = await import('node:fs');
const stat = fs.statSync(OUT_PNG);
console.log(`✓ Generated: ${OUT_PNG}`);
console.log(`  Dimensions: 1440 × ${totalHeight} (× 2 deviceScaleFactor)`);
console.log(`  File size:  ${(stat.size / 1024).toFixed(1)} KB`);

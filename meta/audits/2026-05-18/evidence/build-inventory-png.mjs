#!/usr/bin/env node
/**
 * Inventory overview PNG — high-level inventory.csv visualization.
 *
 * Pulls from page-data.json (which already merges inventory.csv with every lens's
 * per-page output, so we get types, framework classifications, personas, and journey
 * stages alongside the raw inventory columns).
 *
 * Generates:
 *   meta/audits/2026-05-18/inventory-overview.html  (interactive/inspectable)
 *   meta/audits/2026-05-18/inventory-overview.png   (screenshot for Slack/sharing)
 *
 * Run from the promptless.ai repo root:
 *   node meta/audits/2026-05-18/evidence/build-inventory-png.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const AUDIT_DIR = resolve(import.meta.dirname, '..');
const EVIDENCE = resolve(AUDIT_DIR, 'evidence');
const HTML_OUT = resolve(AUDIT_DIR, 'inventory-overview.html');
const PNG_OUT = resolve(AUDIT_DIR, 'inventory-overview.png');

const data = JSON.parse(readFileSync(resolve(EVIDENCE, 'page-data.json'), 'utf8'));
const rows = data.rows;

// ===== AGGREGATIONS =====

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function tally(arr, keyFn) {
  const m = {};
  for (const x of arr) { const k = keyFn(x); m[k] = (m[k] || 0) + 1; }
  return m;
}
function sortedEntries(obj, descByValue = true) {
  return Object.entries(obj).sort((a, b) => descByValue ? b[1] - a[1] : a[1] - b[1]);
}
function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
}

const total = rows.length;
const sectionCounts = tally(rows, r => r.slug.split('/')[1] || '(root)');
const goodDocsCounts = tally(rows, r => r.good_docs_type || 'unknown');
const diataxisCounts = tally(rows, r => r.diataxis_mode || 'unknown');
const sevenActionCounts = tally(rows, r => r.seven_action || 'unknown');
// Seven Action: count pages serving each action (split combined strings like "Appraise+Understand")
const sevenActions = ['Appraise', 'Understand', 'Explore', 'Practice', 'Remember', 'Develop', 'Troubleshoot'];
const sevenActionPerAction = Object.fromEntries(sevenActions.map(a => [a, 0]));
for (const r of rows) {
  const sa = String(r.seven_action || '');
  for (const a of sevenActions) if (sa.includes(a)) sevenActionPerAction[a]++;
}

const riskCounts = tally(rows, r => r.risk_class || 'unknown');
const journeyCounts = tally(rows, r => r.journey_stage_served || 'unknown');
const personaCounts = tally(rows, r => r.primary_persona || 'unknown');

const wordCounts = rows.map(r => r.word_count || 0);
const ages = rows.map(r => r.age_days || 0);

// Word-count buckets
const wcBuckets = [
  { label: '0–100', test: w => w < 100 },
  { label: '100–300', test: w => w >= 100 && w < 300 },
  { label: '300–600', test: w => w >= 300 && w < 600 },
  { label: '600–1000', test: w => w >= 600 && w < 1000 },
  { label: '1000+', test: w => w >= 1000 },
].map(b => ({ ...b, count: wordCounts.filter(b.test).length }));

// Age buckets
const ageBuckets = [
  { label: '0–14d', test: a => a < 14 },
  { label: '14–30d', test: a => a >= 14 && a < 30 },
  { label: '30–60d', test: a => a >= 30 && a < 60 },
  { label: '60–90d', test: a => a >= 60 && a < 90 },
  { label: '90d+', test: a => a >= 90 },
].map(b => ({ ...b, count: ages.filter(b.test).length }));

// Quality signals
const descCount = rows.filter(r => r.description_present).length;
const altFullCount = rows.filter(r => r.image_count > 0 && r.image_alt_present_ratio === 1).length;
const altPagesCount = rows.filter(r => r.image_count > 0).length;
const visibleCount = rows.filter(r => !r.sidebar_hidden).length;
const inboundCount = rows.filter(r => r.inbound_link_count > 0).length;
const orphans = rows.filter(r => r.inbound_link_count === 0 && !r.sidebar_hidden).length;
const hasFindingCount = rows.filter(r => r.finding_ids_semicolon_delimited).length;
const ddTestedCount = rows.filter(r => r.dd_test_covered).length;
const ddStepsPages = rows.filter(r => r.dd_steps_block_count > 0).length;

// KPI snapshot
const kpis = [
  { num: total, label: 'Pages' },
  { num: Object.keys(sectionCounts).length, label: 'Sections' },
  { num: total - visibleCount, label: 'Hidden', sub: `${Math.round((total - visibleCount) / total * 100)}%` },
  { num: median(wordCounts), label: 'Median words', sub: `min ${Math.min(...wordCounts)} · max ${Math.max(...wordCounts)}` },
  { num: median(ages.filter(a => a > 0)), label: 'Median age (d)', sub: `max ${Math.max(...ages)}d` },
  { num: descCount, label: 'With description', sub: `${Math.round(descCount / total * 100)}%` },
  { num: altPagesCount === 0 ? 0 : altFullCount, label: 'Full alt-text', sub: `of ${altPagesCount} pages w/ images` },
  { num: orphans, label: 'Orphans', sub: 'visible · 0 inbound' },
];

// Color palettes
const COLOR_TYPES = {
  'how-to': '#0891b2',
  'reference': '#16a34a',
  'concept': '#7c3aed',
  'quickstart': '#d97706',
  'tutorial': '#d97706',
  'troubleshooting': '#dc2626',
  'stub': '#9ca3af',
  'unknown': '#d1d5db',
  'explanation': '#7c3aed',
};
const COLOR_RISK = { high: '#b91c1c', medium: '#d97706', low: '#6b7280' };

// ===== CHART HELPERS =====

function hbar({ entries, total, height = 20, width = 420, colorFn = () => '#3b82f6', labelW = 160, valueRight = true, showPct = false }) {
  const totalSum = total || entries.reduce((s, [, v]) => s + v, 0);
  const max = Math.max(...entries.map(([, v]) => v));
  const barW = width - labelW - (valueRight ? 50 : 0);
  return `
    <svg viewBox="0 0 ${width} ${entries.length * (height + 6) + 8}" class="chart">
      ${entries.map(([k, v], i) => {
        const y = i * (height + 6) + 4;
        const w = max === 0 ? 0 : (v / max) * barW;
        const pct = totalSum ? Math.round((v / totalSum) * 100) : 0;
        return `
          <text x="${labelW - 6}" y="${y + height * 0.7}" text-anchor="end" font-size="12" fill="#374151">${esc(k)}</text>
          <rect x="${labelW}" y="${y}" width="${w}" height="${height}" fill="${colorFn(k, v)}" rx="3"/>
          <text x="${labelW + w + 6}" y="${y + height * 0.7}" font-size="12" fill="#111827" font-weight="600">${v}${showPct ? ` (${pct}%)` : ''}</text>
        `;
      }).join('')}
    </svg>
  `;
}

function donut({ entries, cx = 90, cy = 90, r = 60, sw = 22, colorFn = () => '#3b82f6', centerLabel, centerSub }) {
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return '';
  let angle = -Math.PI / 2;
  const arcs = entries.map(([k, v]) => {
    const a = (v / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const a2 = angle + a;
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = a > Math.PI ? 1 : 0;
    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    angle = a2;
    return { d, color: colorFn(k, v), k, v };
  });
  return `
    <svg viewBox="0 0 180 180" class="chart-donut">
      ${arcs.map(a => `<path d="${a.d}" stroke="${a.color}" stroke-width="${sw}" fill="none"/>`).join('')}
      ${centerLabel ? `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="700" fill="#111827">${esc(centerLabel)}</text>` : ''}
      ${centerSub ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(centerSub)}</text>` : ''}
    </svg>
  `;
}

function donutWithLegend({ entries, colorFn, centerLabel, centerSub }) {
  return `
    <div class="donut-block">
      ${donut({ entries, colorFn, centerLabel, centerSub })}
      <div class="legend">
        ${entries.map(([k, v]) => `
          <div class="legend-item">
            <span class="dot" style="background:${colorFn(k, v)}"></span>
            <span class="legend-label">${esc(k)}</span>
            <span class="legend-value">${v}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function histogramSvg({ buckets, width = 420, height = 130, color = '#3b82f6' }) {
  const padL = 50, padB = 24, padR = 16, padT = 8;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const max = Math.max(...buckets.map(b => b.count));
  const barW = chartW / buckets.length;
  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart">
      <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="#d1d5db"/>
      ${buckets.map((b, i) => {
        const h = max === 0 ? 0 : (b.count / max) * chartH;
        const x = padL + i * barW + barW * 0.1;
        const y = padT + chartH - h;
        return `
          <rect x="${x}" y="${y}" width="${barW * 0.8}" height="${h}" fill="${color}" rx="2"/>
          <text x="${x + barW * 0.4}" y="${y - 4}" text-anchor="middle" font-size="11" fill="#111827" font-weight="600">${b.count}</text>
          <text x="${x + barW * 0.4}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(b.label)}</text>
        `;
      }).join('')}
    </svg>
  `;
}

function qualitySignals() {
  const signals = [
    { label: 'Description present', count: descCount, denom: total, color: descCount / total > 0.5 ? '#16a34a' : '#dc2626' },
    { label: 'Visible in sidebar', count: visibleCount, denom: total, color: '#16a34a' },
    { label: 'Inbound links > 0', count: inboundCount, denom: total, color: inboundCount / total > 0.5 ? '#16a34a' : '#d97706' },
    { label: 'Full alt-text (pages w/ images)', count: altFullCount, denom: altPagesCount, color: '#16a34a' },
    { label: 'Has Doc Detective test', count: ddTestedCount, denom: ddStepsPages, color: ddTestedCount === 0 ? '#dc2626' : '#16a34a' },
    { label: 'Has audit finding attached', count: hasFindingCount, denom: total, color: '#6b7280' },
  ];
  const padL = 220, w = 460, rowH = 28;
  const barW = w - padL - 60;
  return `
    <svg viewBox="0 0 ${w} ${signals.length * rowH + 10}" class="chart">
      ${signals.map((s, i) => {
        const y = i * rowH + 4;
        const pct = s.denom === 0 ? 0 : (s.count / s.denom);
        const bw = pct * barW;
        return `
          <text x="${padL - 10}" y="${y + 18}" text-anchor="end" font-size="12" fill="#374151">${esc(s.label)}</text>
          <rect x="${padL}" y="${y + 6}" width="${barW}" height="14" fill="#f3f4f6" rx="3"/>
          <rect x="${padL}" y="${y + 6}" width="${bw}" height="14" fill="${s.color}" rx="3"/>
          <text x="${padL + barW + 6}" y="${y + 18}" font-size="12" fill="#111827" font-weight="600">${s.count}/${s.denom}</text>
        `;
      }).join('')}
    </svg>
  `;
}

function ageByRiskGroup() {
  const groups = ['high', 'medium', 'low'];
  const buckets = ['0–14d', '14–60d', '60d+'];
  const matrix = {};
  for (const g of groups) {
    matrix[g] = { '0–14d': 0, '14–60d': 0, '60d+': 0 };
    for (const r of rows) {
      if (r.risk_class !== g) continue;
      const a = r.age_days || 0;
      if (a < 14) matrix[g]['0–14d']++;
      else if (a < 60) matrix[g]['14–60d']++;
      else matrix[g]['60d+']++;
    }
  }
  const padL = 80, padB = 24, padT = 8, padR = 20;
  const w = 420, h = 200;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const groupGap = chartW / groups.length;
  const max = Math.max(...groups.flatMap(g => buckets.map(b => matrix[g][b])));
  const subBarW = (groupGap - 16) / buckets.length;
  const subColors = ['#16a34a', '#d97706', '#dc2626'];
  return `
    <svg viewBox="0 0 ${w} ${h}" class="chart">
      <line x1="${padL}" y1="${padT + chartH}" x2="${w - padR}" y2="${padT + chartH}" stroke="#d1d5db"/>
      ${groups.map((g, gi) => {
        const baseX = padL + gi * groupGap + 8;
        return `
          ${buckets.map((b, bi) => {
            const v = matrix[g][b];
            const barH = max === 0 ? 0 : (v / max) * chartH;
            const x = baseX + bi * subBarW;
            const y = padT + chartH - barH;
            return `
              <rect x="${x}" y="${y}" width="${subBarW - 2}" height="${barH}" fill="${subColors[bi]}" rx="2"/>
              ${v > 0 ? `<text x="${x + subBarW / 2}" y="${y - 3}" text-anchor="middle" font-size="10" fill="#111827" font-weight="600">${v}</text>` : ''}
            `;
          }).join('')}
          <text x="${baseX + (groupGap - 16) / 2}" y="${h - 8}" text-anchor="middle" font-size="12" fill="#374151" font-weight="600">${esc(g)} (${rows.filter(r => r.risk_class === g).length})</text>
        `;
      }).join('')}
      <g transform="translate(${padL}, 0)">
        ${buckets.map((b, i) => `
          <g transform="translate(${i * 70}, 0)">
            <rect x="0" y="0" width="10" height="10" fill="${subColors[i]}"/>
            <text x="14" y="9" font-size="10" fill="#6b7280">${esc(b)}</text>
          </g>
        `).join('')}
      </g>
    </svg>
  `;
}

function perPageGrid() {
  // 59 cells, colored by Good Docs type, labeled with short slug suffix
  // Layout: 8 cols × ~8 rows
  const cols = 8;
  const rowsN = Math.ceil(rows.length / cols);
  const cellW = 165;
  const cellH = 56;
  const w = cellW * cols + 16;
  const h = cellH * rowsN + 32;
  // Sort by section then slug for visual grouping
  const sorted = [...rows].sort((a, b) => {
    const sa = a.slug.split('/')[1] || '';
    const sb = b.slug.split('/')[1] || '';
    return sa.localeCompare(sb) || a.slug.localeCompare(b.slug);
  });
  return `
    <svg viewBox="0 0 ${w} ${h}" class="chart">
      ${sorted.map((r, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellW + 4;
        const y = row * cellH + 4;
        const type = r.good_docs_type || 'unknown';
        const color = COLOR_TYPES[type] || '#d1d5db';
        const tail = r.slug.split('/').slice(-1)[0].replace(/-/g, ' ');
        const displayName = tail.length > 22 ? tail.slice(0, 20) + '…' : tail;
        const dim = r.sidebar_hidden ? 0.45 : 1;
        return `
          <g opacity="${dim}">
            <rect x="${x}" y="${y}" width="${cellW - 8}" height="${cellH - 8}" fill="#fff" stroke="${color}" stroke-width="2" rx="4"/>
            <rect x="${x}" y="${y}" width="4" height="${cellH - 8}" fill="${color}" rx="1"/>
            <text x="${x + 10}" y="${y + 16}" font-size="10" fill="${color}" font-weight="600" text-transform="uppercase">${esc(type)}${r.sidebar_hidden ? ' · hidden' : ''}</text>
            <text x="${x + 10}" y="${y + 30}" font-size="11" fill="#111827" font-weight="500">${esc(displayName)}</text>
            <text x="${x + 10}" y="${y + 44}" font-size="10" fill="#6b7280">${r.word_count}w · ${r.age_days || 0}d</text>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

// ===== HTML ASSEMBLY =====

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inventory Overview — promptless.ai docs</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; background: #fff; }
  .container { max-width: 1400px; margin: 0 auto; padding: 32px 40px; }
  .kicker { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; }
  h1 { font-size: 1.9rem; margin: 4px 0 6px; }
  .lead { color: #4b5563; margin: 0 0 28px; font-size: 0.95rem; max-width: 800px; }

  /* KPI strip */
  .kpi-strip { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 28px; }
  .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; }
  .kpi-num { font-size: 1.6rem; font-weight: 700; line-height: 1; color: #111827; }
  .kpi-label { font-size: 0.75rem; color: #6b7280; margin-top: 4px; font-weight: 500; }
  .kpi-sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }

  /* Chart grid */
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px 20px; }
  .panel h3 { margin: 0 0 14px; font-size: 0.95rem; font-weight: 600; color: #111827; }
  .panel .panel-sub { font-size: 0.78rem; color: #6b7280; margin: -10px 0 14px; }
  .chart { width: 100%; height: auto; display: block; }
  .chart-donut { width: 180px; height: 180px; flex-shrink: 0; }

  /* Donut + legend */
  .donut-block { display: flex; align-items: center; gap: 18px; }
  .legend { display: flex; flex-direction: column; gap: 5px; font-size: 0.85rem; min-width: 0; flex: 1; }
  .legend-item { display: grid; grid-template-columns: 14px 1fr auto; gap: 8px; align-items: center; color: #374151; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .legend-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend-value { font-weight: 600; color: #111827; }

  /* Full-width section */
  .panel-wide { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px 20px; margin-bottom: 24px; }
  .panel-wide h3 { margin: 0 0 14px; font-size: 0.95rem; font-weight: 600; color: #111827; }

  /* Type legend strip */
  .type-strip { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 16px; font-size: 0.8rem; color: #6b7280; }
  .type-strip .dot { width: 12px; height: 4px; border-radius: 2px; }

  /* Footer */
  .footer { margin-top: 24px; padding: 16px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; color: #6b7280; font-size: 0.85rem; text-align: center; font-style: italic; }
</style>
</head>
<body>
<div class="container">
  <div class="kicker">Inventory Overview · ${esc(data.generated_at || '2026-05-18')}</div>
  <h1>promptless.ai docs — what we have, how it's classified, where it fits</h1>
  <p class="lead">High-level view of the ${total}-page documentation set. Page counts, type distributions, framework classifications, quality signals, and staleness — joined from <code>inventory.csv</code> and every audit lens via <code>page-data.json</code>.</p>

  <div class="kpi-strip">
    ${kpis.map(k => `
      <div class="kpi">
        <div class="kpi-num">${k.num}</div>
        <div class="kpi-label">${esc(k.label)}</div>
        ${k.sub ? `<div class="kpi-sub">${esc(k.sub)}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="chart-grid">
    <div class="panel">
      <h3>Pages by section</h3>
      <p class="panel-sub">9 top-level sections; "configuring-promptless" dominates at 29% of all pages.</p>
      ${hbar({
        entries: sortedEntries(sectionCounts),
        total,
        colorFn: () => '#1f2937',
        showPct: true,
        labelW: 200,
        width: 480,
      })}
    </div>

    <div class="panel">
      <h3>Good Docs Project page type</h3>
      <p class="panel-sub">${goodDocsCounts['how-to'] || 0} how-tos · ${goodDocsCounts['reference'] || 0} reference · ${goodDocsCounts['concept'] || 0} concept · ${goodDocsCounts['stub'] || 0} stubs · ${goodDocsCounts['quickstart'] || 0} quickstart</p>
      ${donutWithLegend({
        entries: sortedEntries(goodDocsCounts),
        colorFn: (k) => COLOR_TYPES[k] || '#d1d5db',
        centerLabel: total,
        centerSub: 'pages',
      })}
    </div>

    <div class="panel">
      <h3>Diataxis mode (dominant)</h3>
      <p class="panel-sub">Heavy on how-to + reference; explanation is genuinely thin — the doc set is configuration-led, not learning-led.</p>
      ${donutWithLegend({
        entries: sortedEntries(diataxisCounts),
        colorFn: (k) => COLOR_TYPES[k] || '#d1d5db',
        centerLabel: diataxisCounts['how-to'] || 0,
        centerSub: 'how-to',
      })}
    </div>

    <div class="panel">
      <h3>Seven Action coverage</h3>
      <p class="panel-sub">Pages serving each user action (Ferri Benedetti's Seven Action Model). Develop dominates; Understand/Explore/Practice/Remember are under-served.</p>
      ${hbar({
        entries: sevenActions.map(a => [a, sevenActionPerAction[a]]),
        total,
        colorFn: (k, v) => v <= 2 ? '#dc2626' : v <= 5 ? '#d97706' : '#16a34a',
        labelW: 110,
        width: 480,
        showPct: true,
      })}
    </div>

    <div class="panel">
      <h3>Word count distribution</h3>
      <p class="panel-sub">Median ${median(wordCounts)} words; 5 stubs (&lt;100 words) all in hidden core-concepts.</p>
      ${histogramSvg({ buckets: wcBuckets, color: '#0891b2' })}
    </div>

    <div class="panel">
      <h3>Age distribution (days since last commit)</h3>
      <p class="panel-sub">Median ${median(ages.filter(a => a > 0))}d, max ${Math.max(...ages)}d. Most pages are recent active work; ~10 pages clustered at the repo's 82d origin.</p>
      ${histogramSvg({ buckets: ageBuckets, color: '#7c3aed' })}
    </div>

    <div class="panel">
      <h3>Quality signals</h3>
      <p class="panel-sub">Coverage of expected attributes. Red = under 50%; orange = 50–75%; green = above 75%.</p>
      ${qualitySignals()}
    </div>

    <div class="panel">
      <h3>Age × risk-class</h3>
      <p class="panel-sub">Freshness against the proposed cadence (60d / 120d / 270d for high/medium/low risk). ${rows.filter(r => r.freshness_overdue).length} pages currently overdue.</p>
      ${ageByRiskGroup()}
    </div>
  </div>

  <div class="panel-wide">
    <h3>Every page at a glance (${total} pages)</h3>
    <p class="panel-sub">Each card: page type stripe, slug tail, word count · age. Hidden pages dimmed.</p>
    <div class="type-strip">
      ${Object.entries(COLOR_TYPES).filter(([k]) => goodDocsCounts[k]).map(([k, c]) => `
        <span><span class="dot" style="background:${c}"></span> ${esc(k)} (${goodDocsCounts[k] || 0})</span>
      `).join('')}
    </div>
    ${perPageGrid()}
  </div>

  <div class="footer">
    Source: <code>meta/audits/2026-05-18/evidence/page-data.json</code> (joined from <code>inventory.csv</code> + every audit lens). Regenerate this overview with <code>node meta/audits/2026-05-18/evidence/build-inventory-png.mjs</code>.
  </div>
</div>
</body>
</html>`;

writeFileSync(HTML_OUT, html);
console.log(`✓ HTML written: ${HTML_OUT}`);
console.log(`  Size: ${(html.length / 1024).toFixed(1)} KB`);

// ===== SCREENSHOT VIA PLAYWRIGHT =====

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1500, height: 1000 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(`file://${HTML_OUT}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(200);

// Measure full content height
const fullHeight = await page.evaluate(() => {
  return Math.ceil(document.documentElement.scrollHeight);
});

await page.setViewportSize({ width: 1500, height: fullHeight });
await page.waitForTimeout(100);

await page.screenshot({
  path: PNG_OUT,
  fullPage: false,
  clip: { x: 0, y: 0, width: 1500, height: fullHeight },
});
await browser.close();

const stat = (await import('node:fs')).statSync(PNG_OUT);
console.log('');
console.log(`✓ PNG written: ${PNG_OUT}`);
console.log(`  Dimensions: 1500 × ${fullHeight} (× 2 deviceScaleFactor)`);
console.log(`  File size:  ${(stat.size / 1024).toFixed(1)} KB`);

/**
 * Local mock of the Agent Score API (contract v1) for frontend development.
 *
 *   npm run dev:agent-score-mock      # listens on http://127.0.0.1:5000
 *   npm run dev                       # the site's dev build calls 127.0.0.1:5000
 *
 * Serves the fixtures in src/lib/agent-score/fixtures/, simulates a scan over
 * about 10 seconds with real per-check progress, and keeps new scans in memory
 * so the full scan → poll → score page flow works offline. Plain node:http, no
 * dependencies.
 *
 * Test hooks (by hostname you scan):
 *   - contains "unreachable" → the scan fails with error.code "unreachable"
 *   - contains "ratelimit"   → POST /scans returns 429 rate_limited
 *   - contains "private"     → POST /scans returns 400 private_address
 * Env:
 *   PORT                                  default 5000
 *   AGENT_SCORE_MOCK_SCAN_SECONDS         default 10
 *   AGENT_SCORE_MOCK_EMPTY_LEADERBOARD=1  serve an empty leaderboard
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeTargetUrl } from '../src/lib/agent-score/slug';
import { CATEGORIES, GRADE_HEX, gradeTone } from '../src/lib/agent-score/meta';
import type {
  CheckChange,
  HistoryEntry,
  LeaderboardEntry,
  ScanResult,
  ScanStatusResponse,
  SiteResponse,
} from '../src/lib/agent-score/types';

const PORT = Number(process.env.PORT || 5000);
const SCAN_MS = Number(process.env.AGENT_SCORE_MOCK_SCAN_SECONDS || 10) * 1000;
const COOLDOWN_MS = 10 * 60 * 1000;
const PREFIX = '/public/free-tools/agent-score';
const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'agent-score', 'fixtures');
const CHECK_IDS = CATEGORIES.flatMap((category) => category.checks.map((check) => check.id));

const sites = new Map<string, SiteResponse>();
for (const file of readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('.json'))) {
  const site = JSON.parse(readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as SiteResponse;
  sites.set(site.slug, site);
}
const templates = [...sites.values()].map((site) => site.latest);

// Leaderboard filler so the landing page looks populated. Fictional domains.
const FILLER: Array<[string, number]> = [
  ['docs.northwind-api.dev', 100], ['developer.lumen-pay.io', 97], ['docs.orbitdb.cloud', 93],
  ['docs.quillstack.com', 88], ['help.tidewater.app', 81], ['docs.kestrel-ml.ai', 76],
  ['api.fernhollow.dev/docs', 71], ['docs.copperline.io', 64], ['support.basaltcrm.com/docs', 52],
];
const fillerEntries: LeaderboardEntry[] = FILLER.map(([slug, overall], index) => ({
  slug,
  scanUrl: `https://${slug}`,
  displayName: slug,
  overall,
  grade: gradeFor(overall),
  scannedAt: new Date(Date.UTC(2026, 9, 12 - index, 15, 0, 0)).toISOString(),
  scanCount: 1 + (index % 4),
}));

interface MockScan {
  scanId: string;
  slug: string;
  scanUrl: string;
  createdAt: number;
  fail?: boolean;
  result?: ScanResult;
}
const scans = new Map<string, MockScan>();

function gradeFor(score: number): ScanResult['grade'] {
  if (score >= 100) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body, null, 2));
}

function error(res: ServerResponse, status: number, code: string, message: string) {
  send(res, status, { error: code, message });
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

function activeScanFor(slug: string): MockScan | undefined {
  return [...scans.values()].find((scan) => scan.slug === slug && !scan.result && !scan.fail && Date.now() - scan.createdAt < SCAN_MS);
}

/** Build a result for a finished scan from the closest fixture. */
function finishScan(scan: MockScan): void {
  if (scan.result || scan.fail) return;
  const existing = sites.get(scan.slug);
  const template = existing?.latest ?? templates[hash(scan.slug) % templates.length];
  const result: ScanResult = structuredClone(template);
  result.scanId = scan.scanId;
  result.slug = scan.slug;
  result.scanUrl = scan.scanUrl;
  result.scannedAt = new Date(scan.createdAt + SCAN_MS).toISOString();
  scan.result = result;

  const historyEntry: HistoryEntry = {
    scanId: result.scanId,
    scannedAt: result.scannedAt,
    overall: result.overall,
    grade: result.grade,
    engineVersion: result.engine.version,
    summary: result.summary,
    categoryScores: Object.fromEntries(result.categories.map((category) => [category.id, category.score])),
  };

  if (existing) {
    const before = existing.latest;
    const changes: CheckChange[] = [];
    const beforeChecks = new Map(before.categories.flatMap((category) => category.checks.map((check) => [check.id, check])));
    for (const category of result.categories) {
      for (const check of category.checks) {
        const prev = beforeChecks.get(check.id);
        const delta = (check.earned ?? 0) - (prev?.earned ?? 0);
        if (!prev || prev.status !== check.status || Math.abs(delta) >= 0.5) {
          changes.push({ checkId: check.id, name: check.name, category: category.id, from: prev?.status ?? null, to: check.status, scoreDelta: delta });
        }
      }
    }
    sites.set(scan.slug, {
      ...existing,
      lastScannedAt: result.scannedAt,
      scanCount: existing.scanCount + 1,
      latest: result,
      previous: { scanId: before.scanId, scannedAt: before.scannedAt, overall: before.overall, grade: before.grade },
      changes,
      history: [historyEntry, ...existing.history].slice(0, 100),
      activeScan: null,
    });
  } else {
    sites.set(scan.slug, {
      slug: scan.slug,
      scanUrl: scan.scanUrl,
      displayName: scan.slug,
      firstScannedAt: result.scannedAt,
      lastScannedAt: result.scannedAt,
      scanCount: 1,
      latest: result,
      previous: null,
      changes: [],
      history: [historyEntry],
      activeScan: null,
    });
  }
}

function scanStatus(scan: MockScan): ScanStatusResponse {
  const elapsed = Date.now() - scan.createdAt;
  const total = CHECK_IDS.length;
  const queued = elapsed < 800;
  const done = elapsed >= SCAN_MS;
  if (done && !scan.fail) finishScan(scan);
  const completed = done ? total : queued ? 0 : Math.min(total - 1, Math.floor(((elapsed - 800) / (SCAN_MS - 800)) * total));
  const currentCheck = done ? null : CHECK_IDS[completed] ?? null;
  const failedNow = scan.fail && elapsed >= SCAN_MS / 3;
  return {
    scanId: scan.scanId,
    slug: scan.slug,
    scanUrl: scan.scanUrl,
    status: failedNow ? 'failed' : done ? 'complete' : queued ? 'queued' : 'running',
    createdAt: new Date(scan.createdAt).toISOString(),
    startedAt: queued ? null : new Date(scan.createdAt + 800).toISOString(),
    finishedAt: done || failedNow ? new Date(scan.createdAt + (failedNow ? SCAN_MS / 3 : SCAN_MS)).toISOString() : null,
    progress: {
      completed,
      total,
      currentCheck,
      message: currentCheck ? `[${completed + 1}/${total}] ${currentCheck}...` : null,
    },
    error: failedNow ? { code: 'unreachable', message: `Could not connect to ${scan.scanUrl}.` } : null,
    result: done && !scan.fail ? scan.result ?? null : null,
  };
}

function badge(slug: string): string {
  const site = sites.get(slug);
  const right = site ? `${site.latest.overall} · ${site.latest.grade}` : 'unscored';
  const color = site ? GRADE_HEX[gradeTone(site.latest.grade)] : '#9f9f9f';
  const leftWidth = 82;
  const rightWidth = 12 + right.length * 7;
  const width = leftWidth + rightWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="agent score: ${right}">
  <rect width="${leftWidth}" height="20" fill="#555"/><rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
  <g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">
    <text x="${leftWidth / 2}" y="14">agent score</text><text x="${leftWidth + rightWidth / 2}" y="14">${right}</text>
  </g></svg>`;
}

function leaderboard(sort: string, limit: number) {
  if (process.env.AGENT_SCORE_MOCK_EMPTY_LEADERBOARD === '1') {
    return { generatedAt: new Date().toISOString(), totalSites: 0, entries: [] };
  }
  const real: LeaderboardEntry[] = [...sites.values()].map((site) => ({
    slug: site.slug,
    scanUrl: site.scanUrl,
    displayName: site.displayName,
    overall: site.latest.overall,
    grade: site.latest.grade,
    scannedAt: site.latest.scannedAt,
    scanCount: site.scanCount,
  }));
  const entries = [...real, ...fillerEntries];
  entries.sort((a, b) =>
    sort === 'recent'
      ? b.scannedAt.localeCompare(a.scannedAt)
      : b.overall - a.overall || b.scannedAt.localeCompare(a.scannedAt),
  );
  return { generatedAt: new Date().toISOString(), totalSites: entries.length, entries: entries.slice(0, limit) };
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  console.log(`${req.method} ${url.pathname}${url.search}`);

  if (!pathname.startsWith(PREFIX)) return error(res, 404, 'not_found', 'Not found.');
  const route = pathname.slice(PREFIX.length);

  if (req.method === 'POST' && route === '/scans') {
    const body = await readJson(req);
    if (typeof body.website === 'string' && body.website.trim()) {
      return send(res, 200, { scanId: randomUUID(), slug: 'honeypot.example.com', status: 'queued', cached: false, siteUrl: 'https://promptless.ai/agent-score' });
    }
    const normalized = normalizeTargetUrl(String(body.url ?? ''));
    if (!normalized.ok) return error(res, 400, 'invalid_url', normalized.reason);
    const { slug, url: scanUrl } = normalized.value;
    if (slug.includes('ratelimit')) return error(res, 429, 'rate_limited', 'You have started too many scans. Try again in an hour.');
    if (slug.includes('private')) return error(res, 400, 'private_address', 'That hostname resolves to a private network address.');
    const siteUrl = `https://promptless.ai/agent-score/${slug}`;

    const existing = sites.get(slug);
    if (existing && Date.now() - Date.parse(existing.lastScannedAt) < COOLDOWN_MS) {
      return send(res, 200, { scanId: existing.latest.scanId, slug, status: 'complete', cached: true, siteUrl });
    }
    const active = activeScanFor(slug);
    if (active) return send(res, 202, { scanId: active.scanId, slug, status: 'running', cached: false, siteUrl });

    const scan: MockScan = { scanId: randomUUID(), slug, scanUrl, createdAt: Date.now(), fail: slug.includes('unreachable') };
    scans.set(scan.scanId, scan);
    return send(res, 202, { scanId: scan.scanId, slug, status: 'queued', cached: false, siteUrl });
  }

  if (req.method !== 'GET') return error(res, 405, 'method_not_allowed', 'Method not allowed.');

  const scanMatch = route.match(/^\/scans\/([^/]+)$/);
  if (scanMatch) {
    const scan = scans.get(scanMatch[1]);
    if (scan) return send(res, 200, scanStatus(scan));
    // Cached responses hand back the latest completed scan id.
    const site = [...sites.values()].find((candidate) => candidate.latest.scanId === scanMatch[1]);
    if (site) {
      return send(res, 200, {
        scanId: site.latest.scanId, slug: site.slug, scanUrl: site.scanUrl, status: 'complete',
        createdAt: site.latest.scannedAt, startedAt: site.latest.scannedAt, finishedAt: site.latest.scannedAt,
        progress: { completed: CHECK_IDS.length, total: CHECK_IDS.length, currentCheck: null, message: null },
        error: null, result: site.latest,
      } satisfies ScanStatusResponse);
    }
    return error(res, 404, 'not_found', 'Unknown scan.');
  }

  if (route === '/leaderboard') {
    const sort = url.searchParams.get('sort') === 'recent' ? 'recent' : 'top';
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));
    return send(res, 200, leaderboard(sort, limit), { 'Cache-Control': 'public, max-age=60' });
  }

  const siteMatch = route.match(/^\/sites\/(.+?)(\/badge\.svg|\/scans\/([^/]+))?$/);
  if (siteMatch) {
    const slug = siteMatch[1];
    // Finish any scan whose simulated time has elapsed even if nobody polled it.
    for (const scan of scans.values()) if (scan.slug === slug) scanStatus(scan);
    if (siteMatch[2] === '/badge.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' });
      res.end(badge(slug));
      return;
    }
    const site = sites.get(slug);
    if (!site) return error(res, 404, 'not_found', 'This site has not been scored yet.');
    if (siteMatch[3]) {
      if (site.latest.scanId === siteMatch[3]) return send(res, 200, site.latest);
      return error(res, 404, 'not_found', 'Unknown scan for this site.');
    }
    const active = activeScanFor(slug);
    return send(res, 200, { ...site, activeScan: active ? { scanId: active.scanId, status: 'running' } : null });
  }

  return error(res, 404, 'not_found', 'Not found.');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Agent Score mock API on http://127.0.0.1:${PORT}${PREFIX}`);
  console.log(`Fixtures: ${[...sites.keys()].join(', ')}`);
});

/**
 * Types for the Agent Score API contract (v1).
 *
 * The backend lives in the Promptless monorepo under
 * `/public/free-tools/agent-score`; this site only renders its responses. Keep
 * these in step with the contract document, and with
 * scripts/agent-score-mock-api.ts, which implements the same shapes locally.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip' | 'error';
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type CheckTier = 'critical' | 'high' | 'medium' | 'low';
export type ScanStatus = 'queued' | 'running' | 'complete' | 'failed';

export interface StatusCounts {
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  error: number;
}

export interface ScanSummary extends StatusCounts {
  total: number;
}

export interface Engine {
  name: string;
  version: string;
  specVersion: string;
  scoringVersion: string;
  specUrl: string;
}

export interface ScoreCap {
  cap: number;
  checkId: string;
  reason: string;
}

export interface RequestSummary {
  requests: number;
  failed: number;
  failureRate: number;
  stalledBodies: number;
  challengePages: number;
  fetchErrors: number;
}

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  description?: string;
  message: string;
  resolution: string | null;
  weight: number;
  tier: CheckTier;
  earned: number | null;
  max: number | null;
  proportion: number | null;
  scoreDisplayMode?: 'numeric' | 'notApplicable';
  dependsOn?: string[] | null;
  evidence?: Record<string, unknown> | null;
}

export interface CategoryResult {
  id: string;
  name: string;
  score: number | null;
  grade: Grade | null;
  counts: StatusCounts;
  checks: CheckResult[];
}

export interface Diagnostic {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolution: string;
}

export interface ScanResult {
  scanId: string;
  slug: string;
  scanUrl: string;
  scannedAt: string;
  engine: Engine;
  overall: number;
  grade: Grade;
  cap: ScoreCap | null;
  summary: ScanSummary;
  testedPages?: number;
  samplingStrategy?: string;
  discoverySources?: string[];
  requestSummary?: RequestSummary;
  categories: CategoryResult[];
  diagnostics: Diagnostic[];
}

export interface ScanProgress {
  completed: number;
  total: number;
  currentCheck: string | null;
  message?: string | null;
}

export interface ScanError {
  code: 'timeout' | 'afdocs_failed' | 'unreachable' | string;
  message: string;
}

/** `POST /scans` response. */
export interface CreateScanResponse {
  scanId: string;
  slug: string;
  status: ScanStatus;
  cached: boolean;
  siteUrl: string;
}

/** `GET /scans/{scanId}` response. */
export interface ScanStatusResponse {
  scanId: string;
  slug: string;
  scanUrl: string;
  status: ScanStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  progress: ScanProgress | null;
  error: ScanError | null;
  result: ScanResult | null;
}

export interface CheckChange {
  checkId: string;
  name: string;
  category: string;
  from: CheckStatus | null;
  to: CheckStatus | null;
  scoreDelta: number;
}

export interface HistoryEntry {
  scanId: string;
  scannedAt: string;
  overall: number;
  grade: Grade;
  engineVersion: string;
  summary: ScanSummary;
  categoryScores: Record<string, number | null>;
}

/** `GET /sites/{slug}` response. */
export interface SiteResponse {
  slug: string;
  scanUrl: string;
  displayName: string;
  firstScannedAt: string;
  lastScannedAt: string;
  scanCount: number;
  latest: ScanResult;
  /**
   * `comparable` is false when the two scans used different afdocs scoring
   * versions; `changes` is then empty because the scores say nothing about the site.
   */
  previous: {
    scanId: string;
    scannedAt: string;
    overall: number;
    grade: Grade;
    scoringVersion: string | null;
    comparable: boolean;
  } | null;
  changes: CheckChange[];
  /** Newest first, completed scans only. */
  history: HistoryEntry[];
  activeScan: { scanId: string; status: ScanStatus } | null;
}

export interface LeaderboardEntry {
  slug: string;
  scanUrl: string;
  displayName: string;
  overall: number;
  grade: Grade;
  scannedAt: string;
  scanCount: number;
}

/** `GET /leaderboard` response. */
export interface LeaderboardResponse {
  generatedAt: string;
  totalSites: number;
  entries: LeaderboardEntry[];
}

/** Error body for every non-2xx response. */
export interface ApiErrorBody {
  error: string;
  message: string;
}

/**
 * Text builders shared by the score page, its markdown twin, the OG card, and
 * the "Copy fix prompt" button.
 */
import { AFDOCS_REPO_URL, SPEC_URL, categoryName, checkName } from './meta';
import type { CheckResult, ScanResult, SiteResponse } from './types';

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : SHORT_DATE_FORMAT.format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** e.g. "docs.stripe.com scores 86/100 (Grade B), passing 15 of 28 checks; 7 fail, 3 warn." */
export function summarySentence(displayName: string, latest: ScanResult): string {
  const { summary } = latest;
  const tail: string[] = [];
  if (summary.fail) tail.push(`${summary.fail} fail`);
  if (summary.warn) tail.push(`${summary.warn} warn`);
  if (summary.error) tail.push(`${summary.error} errored`);
  if (summary.skip) tail.push(`${summary.skip} skipped`);
  const base = `${displayName} scores ${latest.overall}/100 (Grade ${latest.grade}), passing ${summary.pass} of ${summary.total} checks`;
  return tail.length ? `${base}; ${tail.join(', ')}.` : `${base}.`;
}

export function cliCommand(scanUrl: string, flags = '--format scorecard'): string {
  return `npx afdocs@latest check ${scanUrl}${flags ? ` ${flags}` : ''}`;
}

/** Sum of max points across scored checks: the score's denominator. */
function scoredMaxTotal(latest: ScanResult): number {
  let total = 0;
  for (const category of latest.categories) {
    for (const check of category.checks) {
      if (check.status === 'skip' || check.status === 'error') continue;
      if (typeof check.max === 'number') total += check.max;
    }
  }
  return total;
}

/**
 * Overall points a check would add if it passed, before any score cap. Uses the
 * same arithmetic as afdocs: overall = Σ earned / Σ max × 100.
 */
export function potentialGain(check: CheckResult, latest: ScanResult): number {
  const denominator = scoredMaxTotal(latest);
  if (!denominator || typeof check.max !== 'number') return 0;
  const missing = check.max - (check.earned ?? 0);
  return missing > 0 ? (missing / denominator) * 100 : 0;
}

export interface ActionableCheck {
  check: CheckResult;
  categoryId: string;
  gain: number;
}

/** Failing, warning, and errored checks, ordered by potential score gain. */
export function actionableChecks(latest: ScanResult): ActionableCheck[] {
  const items: ActionableCheck[] = [];
  for (const category of latest.categories) {
    for (const check of category.checks) {
      if (check.status !== 'fail' && check.status !== 'warn' && check.status !== 'error') continue;
      items.push({ check, categoryId: category.id, gain: potentialGain(check, latest) });
    }
  }
  const rank = { fail: 0, error: 1, warn: 2 } as const;
  return items.sort((a, b) => b.gain - a.gain || rank[a.check.status as keyof typeof rank] - rank[b.check.status as keyof typeof rank]);
}

function points(check: CheckResult): string {
  if (typeof check.max !== 'number') return check.tier;
  const earned = Math.round((check.earned ?? 0) * 10) / 10;
  return `${check.tier}, ${earned}/${check.max} points`;
}

function checkBlock(item: ActionableCheck): string[] {
  const { check } = item;
  const lines = [`### ${check.id}: ${checkName(check.id, check.name)} (${points(check)})`, '', `Result: ${check.message}`];
  if (check.resolution) lines.push('', `Fix: ${check.resolution}`);
  return lines;
}

/**
 * A markdown prompt for a coding agent that lists every failing and warning
 * check with its afdocs resolution, ending with the CLI command that verifies
 * the fixes locally.
 */
export function buildFixPrompt(site: SiteResponse, pageUrl: string): string {
  const { latest } = site;
  const items = actionableChecks(latest);
  const failing = items.filter((item) => item.check.status === 'fail' || item.check.status === 'error');
  const warnings = items.filter((item) => item.check.status === 'warn');

  const lines = [
    `# Agent Score fix report: ${site.displayName}`,
    '',
    `URL: ${latest.scanUrl}`,
    `Score: ${latest.overall}/100 (Grade ${latest.grade})`,
    `Engine: afdocs ${latest.engine.version}, Agent-Friendly Docs Spec ${latest.engine.specVersion}`,
    `Report: ${pageUrl}`,
    '',
    `I need help making the documentation at ${latest.scanUrl} easier for AI agents to read. An afdocs scan found ${pluralize(failing.length, 'failing check')} and ${pluralize(warnings.length, 'warning')}. They are listed below, highest potential score gain first.`,
  ];

  if (latest.cap) {
    lines.push('', `Note: the score is capped at ${latest.cap.cap} because of ${latest.cap.checkId}: ${latest.cap.reason} Fix that first.`);
  }

  if (failing.length) {
    lines.push('', '## Failing checks');
    for (const item of failing) lines.push('', ...checkBlock(item));
  }
  if (warnings.length) {
    lines.push('', '## Warnings');
    for (const item of warnings) lines.push('', ...checkBlock(item));
  }
  if (latest.diagnostics.length) {
    lines.push('', '## Site-wide diagnostics');
    for (const diagnostic of latest.diagnostics) {
      lines.push('', `### ${diagnostic.id} (${diagnostic.severity})`, '', diagnostic.message, '', `Fix: ${diagnostic.resolution}`);
    }
  }
  if (!items.length && !latest.diagnostics.length) {
    lines.push('', 'Every scored check passes. Look for regressions and keep the score at its current level.');
  }

  lines.push(
    '',
    '# Instructions',
    '',
    '1. Review each failing check and warning above, starting with the first.',
    '2. Propose concrete changes to the docs site (file paths, build or hosting config, templates, or URLs) that will make each check pass.',
    '3. Where a check is about structure or metadata (llms.txt, markdown output, headers, redirects), include the exact text, config, or markup to add.',
    '4. Group the changes by check, each with a short rationale.',
    '5. Do not invent content that does not exist in the docs. Ask me for source files if unsure.',
    '6. Verify the result locally with afdocs, which prints the fix for every remaining issue:',
    '',
    '```bash',
    cliCommand(latest.scanUrl, '--fixes --verbose'),
    '```',
  );
  return lines.join('\n');
}

function statusWord(status: string | null): string {
  return status ?? 'new';
}

function signed(value: number, digits = 1): string {
  const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export interface MarkdownReportLinks {
  pageUrl: string;
  jsonUrl: string;
  badgeUrl: string;
}

/** The agent-readable twin of the score page. */
export function buildMarkdownReport(site: SiteResponse, links: MarkdownReportLinks): string {
  const { latest } = site;
  const lines = [
    `# Agent Score: ${site.displayName}`,
    '',
    '> For the complete promptless.ai index, see [llms.txt](/llms.txt).',
    '',
    summarySentence(site.displayName, latest),
    '',
    `- Scanned URL: ${latest.scanUrl}`,
    `- Last scanned: ${formatDate(latest.scannedAt)} (${latest.scannedAt})`,
    `- Engine: [afdocs](${AFDOCS_REPO_URL}) ${latest.engine.version}, [Agent-Friendly Docs Spec](${latest.engine.specUrl || SPEC_URL}) ${latest.engine.specVersion}, scoring ${latest.engine.scoringVersion}`,
    `- Pages tested: ${latest.testedPages ?? 'unknown'}${latest.samplingStrategy ? ` (${latest.samplingStrategy} sampling)` : ''}`,
    `- Scans recorded: ${site.scanCount}`,
    `- HTML report: ${links.pageUrl}`,
    `- JSON: ${links.jsonUrl}`,
    `- Badge: ${links.badgeUrl}`,
  ];

  if (latest.cap) {
    lines.push('', `Score capped at ${latest.cap.cap} by \`${latest.cap.checkId}\`: ${latest.cap.reason}`);
  }

  lines.push('', '## Score history', '');
  if (site.history.length <= 1) {
    lines.push('First scan. Rescan later to see trends.');
  } else {
    lines.push('| Scanned | Score | Grade | Pass | Warn | Fail | afdocs |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const entry of site.history.slice(0, 20)) {
      lines.push(`| ${formatDate(entry.scannedAt)} | ${entry.overall} | ${entry.grade} | ${entry.summary.pass} | ${entry.summary.warn} | ${entry.summary.fail} | ${entry.engineVersion} |`);
    }
  }

  if (site.previous) {
    lines.push('', '## What changed since the last scan', '');
    lines.push(`Previous scan on ${formatDate(site.previous.scannedAt)} scored ${site.previous.overall} (Grade ${site.previous.grade}); change ${signed(latest.overall - site.previous.overall, 0)}.`);
    if (site.changes.length) {
      lines.push('');
      for (const change of site.changes) {
        lines.push(`- \`${change.checkId}\` (${checkName(change.checkId, change.name)}): ${statusWord(change.from)} → ${statusWord(change.to)}, ${signed(change.scoreDelta)} points`);
      }
    } else {
      lines.push('', 'No check changed status.');
    }
  }

  if (latest.diagnostics.length) {
    lines.push('', '## Diagnostics');
    for (const diagnostic of latest.diagnostics) {
      lines.push('', `### ${diagnostic.id} (${diagnostic.severity})`, '', diagnostic.message, '', `Fix: ${diagnostic.resolution}`);
    }
  }

  lines.push('', '## Checks by category');
  for (const category of latest.categories) {
    const score = category.score === null ? 'not scored' : `${category.score}/100 (Grade ${category.grade})`;
    lines.push('', `### ${categoryName(category.id, category.name)}: ${score}`, '');
    lines.push('| Check | Status | Tier | Points | Result |', '| --- | --- | --- | --- | --- |');
    for (const check of category.checks) {
      const pts = typeof check.max === 'number' ? `${Math.round((check.earned ?? 0) * 10) / 10}/${check.max}` : '-';
      const message = check.message.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      lines.push(`| \`${check.id}\` ${checkName(check.id, check.name)} | ${check.status} | ${check.tier} | ${pts} | ${message} |`);
    }
    const fixes = category.checks.filter((check) => check.resolution && (check.status === 'warn' || check.status === 'fail'));
    for (const check of fixes) {
      lines.push('', `Fix for \`${check.id}\`: ${check.resolution}`);
    }
  }

  lines.push(
    '',
    '## Run this yourself',
    '',
    'The hosted scanner runs the same open-source command with `--sampling deterministic`, so local numbers match:',
    '',
    '```bash',
    cliCommand(latest.scanUrl, '--format scorecard'),
    cliCommand(latest.scanUrl, '--fixes --verbose'),
    '```',
    '',
    '',
    `Built by Promptless. Powered by [afdocs](${AFDOCS_REPO_URL}) (MIT) by Dachary Carey, which implements the [Agent-Friendly Docs Spec](${SPEC_URL}).`,
  );

  return lines.join('\n');
}

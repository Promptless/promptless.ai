#!/usr/bin/env node
/**
 * Canonical per-page data merger — Addendum 3, Item 1.
 *
 * Reads every per-lens raw output keyed at the page level and emits:
 *   - evidence/page-data.csv  (~32 flat columns × 59 rows; the single front door)
 *   - evidence/page-data.json (same data + nested fields)
 *
 * Idempotent: re-running produces identical output from the same inputs.
 * Blank-fills columns when the source lens didn't run.
 *
 * Run from the promptless.ai repo root:
 *   node meta/audits/2026-05-18/evidence/build-page-data.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse as parseCsv } from 'node:path';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../../..'); // promptless.ai/
const AUDIT_DIR = resolve(import.meta.dirname, '..'); // meta/audits/2026-05-18/
const EVIDENCE = resolve(AUDIT_DIR, 'evidence');
const RAW = resolve(EVIDENCE, 'raw');

// --- Helpers --------------------------------------------------------------

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readCsv(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8').trim();
  const lines = text.split('\n');
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === ',') { cells.push(cur); cur = ''; }
      else if (ch === '"') inQuotes = true;
      else cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function escCsv(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Slug normalization: ensure consistent key across sources
function normalizeSlug(s) {
  if (!s) return '';
  return String(s).trim().replace(/\/$/, '');
}

// URL → slug: http://localhost:4321/docs/foo/bar/ → docs/foo/bar
function urlToSlug(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

// --- Load inputs ----------------------------------------------------------

console.log('Loading inputs...');

// Primary inventory (Python script — has age_days, last_author, all flat columns)
const inv = readJson(resolve(EVIDENCE, 'inventory.json'));
const invRows = inv?.rows || [];
console.log(`  inventory.json: ${invRows.length} rows`);

// AST inventory (gray-matter + remark-mdx — validates frontmatter, has accurate counts)
const ast = readJson(resolve(EVIDENCE, 'inventory-ast.json'));
const astRows = ast?.rows || [];
console.log(`  inventory-ast.json: ${astRows.length} rows`);

// Phase 11 classification
const classification = readCsv(resolve(EVIDENCE, 'classification.csv'));
console.log(`  classification.csv: ${classification.length} rows`);

// Phase 10 ownership
const ownership = readJson(resolve(RAW, 'ownership.json')) || [];
console.log(`  ownership.json: ${ownership.length} rows`);

// Phase 10 AI-tells aggregate
const aiTellsAgg = readJson(resolve(RAW, 'ai-tells/_aggregate.json'));
const aiTellsRows = aiTellsAgg?.rows || [];
console.log(`  ai-tells/_aggregate.json: ${aiTellsRows.length} rows`);

// AI-tells skill verdicts (3 per-page reports)
const aiTellsSkillVerdicts = {
  'docs/configuring-promptless/triggers/api-triggers': 'weak',
  'docs/security-and-privacy/data-handling-and-classification': 'moderate',
  'docs/security-and-privacy/single-sign-on-sso-setup': 'moderate',
};

// Phase 4 Vale
const vale = readJson(resolve(RAW, 'vale.json')) || {};
const valeByPath = {};
for (const [file, alerts] of Object.entries(vale)) {
  // file is absolute; map to relative under src/content/docs
  const rel = file.includes('/src/') ? 'src/' + file.split('/src/')[1] : file;
  const errors = alerts.filter(a => a.Severity === 'error').length;
  const ruleCounts = {};
  for (const a of alerts) ruleCounts[a.Check] = (ruleCounts[a.Check] || 0) + 1;
  const topRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  valeByPath[rel] = {
    alert_count: alerts.length,
    error_count: errors,
    top_rules: topRules.map(([rule, count]) => ({ rule, count })),
  };
}
console.log(`  vale.json: ${Object.keys(valeByPath).length} files`);

// Phase 5 pa11y (URL-keyed; needs slug map)
const pa11y = readJson(resolve(RAW, 'pa11y.json'));
const pa11yBySlug = {};
if (pa11y?.results) {
  for (const [url, issues] of Object.entries(pa11y.results)) {
    const slug = urlToSlug(url);
    if (!slug) continue;
    const ruleCounts = {};
    for (const i of issues || []) ruleCounts[i.code] = (ruleCounts[i.code] || 0) + 1;
    pa11yBySlug[slug] = {
      total_issues: (issues || []).length,
      unique_rules: Object.keys(ruleCounts).length,
      rules: Object.entries(ruleCounts).map(([code, count]) => ({ code, count })),
    };
  }
}
console.log(`  pa11y.json: ${Object.keys(pa11yBySlug).length} URLs`);

// Phase 7 instrumentation (per-file count of data-track-* attributes)
const instr = readCsv(resolve(EVIDENCE, 'instrumentation.csv'));
const instrByPath = {};
for (const r of instr) {
  instrByPath[r.file] = parseInt(r.line_count_data_track || '0', 10);
}
console.log(`  instrumentation.csv: ${Object.keys(instrByPath).length} files`);

// Phase 13 procedural-accuracy sub-lens (Doc Detective) — discovery only (no execution)
// Three discovery sources:
//   1. Spec files at .doc-detective/tests/*.spec.json
//   2. Inline markers in MDX body (Node fs.readdir + regex; no rg dependency)
//   3. <Steps> blocks as the procedure population (denominator)
import { readdirSync as readdirSync2, statSync as statSync2 } from 'node:fs';
import { execSync as execSync2 } from 'node:child_process';

let ddSpecCount = 0;
try {
  const specs = readdirSync2(resolve(ROOT, '.doc-detective/tests'));
  ddSpecCount = specs.filter(n => n.endsWith('.spec.json')).length;
} catch {}

const DD_INLINE_RE = /\{\s*\*doc-detective|<!--\s*doc-detective/g;
const STEPS_RE = /<Steps\b/g;
const ddInlineByPath = {};
const ddStepsByPath = {};
function walkMdxForDD(dir) {
  for (const name of readdirSync2(dir)) {
    const p = resolve(dir, name);
    const st = statSync2(p);
    if (st.isDirectory()) {
      if (name === 'internal') continue;
      walkMdxForDD(p);
    } else if (name.endsWith('.mdx')) {
      const text = readFileSync(p, 'utf8');
      const rel = p.replace(ROOT + '/', '');
      const inlineCount = (text.match(DD_INLINE_RE) || []).length;
      const stepsCount = (text.match(STEPS_RE) || []).length;
      if (inlineCount > 0) ddInlineByPath[rel] = inlineCount;
      if (stepsCount > 0) ddStepsByPath[rel] = stepsCount;
    }
  }
}
walkMdxForDD(resolve(ROOT, 'src/content/docs'));
const ddTotalSteps = Object.values(ddStepsByPath).reduce((a, b) => a + b, 0);
const ddTotalInline = Object.values(ddInlineByPath).reduce((a, b) => a + b, 0);
console.log(`  Doc Detective discovery: ${ddSpecCount} spec files; ${Object.keys(ddInlineByPath).length} pages with inline markers (${ddTotalInline} markers total); ${Object.keys(ddStepsByPath).length} pages with <Steps> (${ddTotalSteps} blocks total)`);

// Phase 6 AFDocs — llms.txt coverage gives us a list of pages IN llms.txt
const afdocs = readJson(resolve(RAW, 'afdocs-latest.json'));
const inLlmsTxt = new Set();
if (afdocs?.results) {
  const llmsCheck = afdocs.results.find(r => r.id === 'llms-txt-exists');
  if (llmsCheck?.details?.discoveredFiles?.[0]?.content) {
    const content = llmsCheck.details.discoveredFiles[0].content;
    for (const m of content.matchAll(/\((https?:\/\/[^)]+)\)/g)) {
      const slug = urlToSlug(m[1]);
      if (slug) inLlmsTxt.add(slug);
    }
  }
}
console.log(`  afdocs-latest.json: ${inLlmsTxt.size} URLs in llms.txt`);

// JSON-LD presence — built from F-0037 result (0 of 94 docs HTML pages have it)
// We mark every doc as has_jsonld=false until proven otherwise
const HAS_JSONLD = false; // F-0037 finding

// Phase 14 findings — parse F-NNNN ↔ page mappings
// Only extract from the formal `Page/entity:` line to avoid picking up evidence-text
// or working-note pages that are not the finding's primary subject.
const findingsText = readFileSync(resolve(AUDIT_DIR, 'findings.md'), 'utf8');
const findingsBySlug = {};
const blocks = findingsText.split(/^### (?:~~)?F-\d{4}/m).slice(1);
const ids = [...findingsText.matchAll(/^### (?:~~)?F-(\d{4})/gm)].map(m => 'F-' + m[1]);
for (let i = 0; i < blocks.length; i++) {
  const fid = ids[i];
  if (!fid) continue;
  // Trim each block at the next `### `, `## `, or `---` separator so blocks don't bleed into
  // working-notes or the next finding.
  let block = blocks[i];
  const endIdx = Math.min(
    ...['\n### ', '\n## ', '\n---\n']
      .map(sep => block.indexOf(sep))
      .filter(idx => idx >= 0)
      .concat([block.length])
  );
  block = block.slice(0, endIdx);
  // Extract the Page/entity line specifically
  const peMatch = block.match(/^[\s-]*\*\*Page\/entity:?\*\*\s*([^\n]+)/im);
  if (!peMatch) continue;
  const peLine = peMatch[1].trim();
  // Skip findings that are (global), (audit env), etc.
  if (/^\(global\)|\(audit env\)|^Footer component|^Gap across/i.test(peLine)) continue;
  // Extract slug-like docs/* paths from the line
  const slugs = new Set();
  for (const m of peLine.matchAll(/(?:src\/content\/docs\/)?(?:`)?(docs\/[a-z0-9][a-z0-9/_-]+)/g)) {
    let slug = m[1].replace(/[.,;:)\]"`]+$/, '').replace(/\.mdx?$/i, '');
    // Strip trailing colon-line-number (e.g., kubernetes-helm.mdx:45 → kubernetes-helm)
    slug = slug.replace(/:\d+$/, '');
    slugs.add(slug);
  }
  for (const slug of slugs) {
    if (!findingsBySlug[slug]) findingsBySlug[slug] = [];
    if (!findingsBySlug[slug].includes(fid)) findingsBySlug[slug].push(fid);
  }
}
console.log(`  findings.md: ${Object.keys(findingsBySlug).length} pages have at least one F-NNNN backlink`);

// Phase 4 cspell — count alerts per page path
const cspell = readJson(resolve(RAW, 'cspell.json')) || { issues: [] };
const cspellByPath = {};
for (const issue of cspell.issues || []) {
  const uri = issue.uri || '';
  const path = uri.replace(/^file:\/\//, '').replace(ROOT + '/', '');
  cspellByPath[path] = (cspellByPath[path] || 0) + 1;
}
console.log(`  cspell.json: ${Object.keys(cspellByPath).length} files`);

// --- Risk class lookup (Phase 10) -----------------------------------------

function riskClass(slug) {
  if (/setup-quickstart|auth|api-trigger|self-hosting|kubernetes|security|privacy|sso|compliance|subprocessor|environment-variables/i.test(slug)) return 'high';
  if (/how-to-use|integration|trigger|context-source|configuring/i.test(slug)) return 'medium';
  return 'low';
}
const cadences = { high: 60, medium: 120, low: 270 };

// --- Persona inference (Phase 12 strategy-level, unvalidated) ------------

function primaryPersona(slug) {
  if (/security-and-privacy|compliance|subprocessor|sso/i.test(slug)) return 'P4-Security';
  if (/self-hosting|kubernetes/i.test(slug)) return 'P5-Ops';
  if (/promptless-oss|getting-started\/promptless-oss/i.test(slug)) return 'P6-OSS';
  if (/api-trigger|github-|bitbucket-|enterprise-/i.test(slug)) return 'P2-Engineer';
  if (/slack-message|intercom|teams-messages/i.test(slug)) return 'P3-Support';
  if (/how-to-use|agent-knowledge-base|deep-analysis|providing-feedback|capture/i.test(slug)) return 'P1-TechWriter';
  return 'P1-TechWriter'; // default
}

// --- Journey stage inference (Phase 13) -----------------------------------

function journeyStageServed(slug) {
  if (/welcome|promptless-1-0|getting-started\/promptless-oss/i.test(slug)) return 'Discover';
  if (/security-and-privacy|pricing/i.test(slug)) return 'Evaluate';
  if (/setup-quickstart|getting-started\/welcome/i.test(slug)) return 'Install';
  if (/trigger|integration|context-source|doc-collection|customizing/i.test(slug)) return 'Configure';
  if (/troubleshoot|faq|frequently-asked|getting-help/i.test(slug)) return 'Troubleshoot';
  if (/self-hosting|kubernetes|account-management/i.test(slug)) return 'Scale';
  if (/how-to-use/i.test(slug)) return 'Configure';
  if (/core-concepts/i.test(slug)) return 'Discover';
  return 'Configure';
}

// --- Major doc flag (Phase 13 mechanical definition) ---------------------

function isMajorDoc(slug) {
  return /quickstart|how-to-use|integrations\/|configuring-promptless\/triggers\/|configuring-promptless\/context-sources\/|setup|auth|sso|self-hosting|getting-started\/|api-trigger|env|configuration-reference/i.test(slug);
}

// --- Merge ----------------------------------------------------------------

const merged = [];
const baseRows = invRows; // primary source
for (const inv of baseRows) {
  const slug = normalizeSlug(inv.slug);
  if (!slug) continue;
  const path = inv.path;

  // AI-tells row
  const ai = aiTellsRows.find(r => normalizeSlug(r.slug) === slug);

  // Vale row (lookup by path)
  const v = valeByPath[path] || valeByPath[path.replace(/^src\//, '')];

  // pa11y by slug
  const p = pa11yBySlug[slug];

  // Classification by slug
  const cls = classification.find(r => normalizeSlug(r.slug) === slug) || {};

  // Ownership by slug
  const own = ownership.find(r => normalizeSlug(r.slug) === slug) || {};

  // Instrumentation by path
  const instr_count = instrByPath[path] || 0;

  // findings backlinks
  const finding_ids = findingsBySlug[slug] || [];

  // Phase 12 persona inference (strategy-level, unvalidated)
  const persona = primaryPersona(slug);

  // Phase 13 journey stage
  const stage = journeyStageServed(slug);
  const major = isMajorDoc(slug);

  // Phase 10 risk class + freshness
  const risk = riskClass(slug);
  const cadence = cadences[risk];
  const overdue = inv.age_days != null && inv.age_days > cadence;

  merged.push({
    // Identity
    path,
    slug,
    title: inv.title,
    sidebar_order: inv.sidebar_order,
    sidebar_hidden: !!inv.sidebar_hidden,
    is_generated: !!inv.is_generated,
    is_major_doc: major,

    // Phase 1
    word_count: inv.word_count,
    h1_count: inv.h1_count,
    h2_count: inv.h2_count,
    code_block_count: inv.code_block_count,
    image_count: inv.image_count,
    image_alt_present_ratio: inv.image_alt_present_ratio,
    internal_link_count: inv.internal_link_count,
    external_link_count: inv.external_link_count,
    inbound_link_count: inv.inbound_link_count,
    description_present: !!inv.description_present,
    last_modified: inv.last_modified,
    last_author: inv.last_author,
    age_days: inv.age_days,
    distinct_committers_count: inv.distinct_committers_count,
    total_commits: inv.total_commits,

    // Phase 4
    vale_alert_count: v?.alert_count ?? '',
    vale_error_count: v?.error_count ?? '',
    cspell_alert_count: cspellByPath[path] ?? 0,

    // Phase 5
    a11y_total_issues: p?.total_issues ?? '',
    a11y_unique_rules: p?.unique_rules ?? '',

    // Phase 6
    has_jsonld: HAS_JSONLD,
    in_llms_txt: inLlmsTxt.has(slug),

    // Phase 7
    instrumentation_count: instr_count,

    // Phase 10
    ai_tell_signal_score: ai?.signal ?? '',
    ai_tell_em_per_300: ai?.emPer300 ?? '',
    ai_tell_skill_verdict: aiTellsSkillVerdicts[slug] || 'n-a',
    risk_class: risk,
    freshness_overdue: overdue,
    freshness_cadence_days: cadence,

    // Phase 11
    good_docs_type: cls.good_docs || '',
    diataxis_mode: cls.diataxis || '',
    seven_action: cls.seven_action || '',

    // Phase 12
    primary_persona: persona,

    // Phase 13 — procedural-accuracy sub-lens (Doc Detective)
    dd_steps_block_count: ddStepsByPath[path] || 0,
    dd_inline_marker_count: ddInlineByPath[path] || 0,
    // Page is "test-covered" only when it has inline markers OR is referenced from a spec file.
    // We don't yet have a per-page → spec map (the 1 existing spec is login, which doesn't map to any docs page),
    // so dd_test_covered = (has inline markers).
    dd_test_covered: (ddInlineByPath[path] || 0) > 0,
    // Execution data — empty this run; future audits with credentials populate these.
    dd_test_passed: '',
    dd_test_failed: '',
    dd_last_run: '',

    // Phase 13 — agent simulation (DARI)
    journey_stage_served: stage,
    dari_task_count: '', // DARI spec-only this run
    dari_success_rate: '',
    dari_stuck_count: '',

    // Phase 14
    finding_ids_semicolon_delimited: finding_ids.join(';'),

    // Nested fields preserved in JSON sidecar
    _nested: {
      ai_tells: ai ? {
        signal_score: ai.signal,
        em_per_300: ai.emPer300,
        vocab_hits: ai.vocabHits,
        vocab_seen: ai.vocabSeen || [],
        closing_hits: ai.closingHits,
        closing_seen: ai.closingSeen || [],
        bold_colon_bullets: ai.boldColonBullets,
        sentence_len_stddev: ai.sentenceLenStddev,
        skill_verdict: aiTellsSkillVerdicts[slug] || null,
      } : null,
      vale: v ? { alert_count: v.alert_count, error_count: v.error_count, top_rules: v.top_rules } : null,
      a11y: p ? { total_issues: p.total_issues, unique_rules: p.unique_rules, rules: p.rules } : null,
      ownership: own.distinct_committers != null ? {
        distinct_committers: own.distinct_committers,
        total_commits: own.total_commits,
        last_author: own.last_author,
        last_modified: own.last_modified,
        risk_class: own.risk_class,
        cadence_days: own.cadence_days,
        overdue: own.overdue,
      } : null,
      finding_ids: finding_ids,
      dari_runs: [], // empty until DARI runs
    },
  });
}

// --- Write CSV ------------------------------------------------------------

const cols = [
  'path', 'slug', 'title', 'sidebar_order', 'sidebar_hidden', 'is_generated', 'is_major_doc',
  'word_count', 'h1_count', 'h2_count', 'code_block_count', 'image_count',
  'image_alt_present_ratio', 'internal_link_count', 'external_link_count',
  'inbound_link_count', 'description_present', 'last_modified', 'last_author',
  'age_days', 'distinct_committers_count', 'total_commits',
  'vale_alert_count', 'vale_error_count', 'cspell_alert_count',
  'a11y_total_issues', 'a11y_unique_rules',
  'has_jsonld', 'in_llms_txt',
  'instrumentation_count',
  'ai_tell_signal_score', 'ai_tell_em_per_300', 'ai_tell_skill_verdict',
  'risk_class', 'freshness_overdue', 'freshness_cadence_days',
  'good_docs_type', 'diataxis_mode', 'seven_action',
  'primary_persona',
  'journey_stage_served',
  'dd_steps_block_count', 'dd_inline_marker_count', 'dd_test_covered',
  'dd_test_passed', 'dd_test_failed', 'dd_last_run',
  'dari_task_count', 'dari_success_rate', 'dari_stuck_count',
  'finding_ids_semicolon_delimited',
];

const csvLines = [cols.join(',')];
for (const row of merged) {
  csvLines.push(cols.map(c => escCsv(row[c])).join(','));
}
writeFileSync(resolve(EVIDENCE, 'page-data.csv'), csvLines.join('\n') + '\n');

// --- Write JSON sidecar ---------------------------------------------------

writeFileSync(resolve(EVIDENCE, 'page-data.json'), JSON.stringify({
  generated_at: '2026-05-18',
  audit_dir: 'meta/audits/2026-05-18/',
  schema_version: 1,
  total_pages: merged.length,
  columns: cols,
  rows: merged.map(r => {
    // Strip _nested for top-level; merge into per-row record under "nested"
    const { _nested, ...flat } = r;
    return { ...flat, nested: _nested };
  }),
}, null, 2));

// --- Verify ---------------------------------------------------------------

console.log('');
console.log('=== Output ===');
console.log(`  page-data.csv: ${csvLines.length} lines (1 header + ${csvLines.length - 1} rows)`);
console.log(`  page-data.json: ${merged.length} records`);

// Column coverage check
const colCoverage = {};
for (const c of cols) {
  colCoverage[c] = merged.filter(r => r[c] !== '' && r[c] != null).length;
}
console.log('');
console.log('=== Column coverage (non-blank cells / 59) ===');
for (const [c, n] of Object.entries(colCoverage)) {
  const pct = Math.round((n / merged.length) * 100);
  console.log(`  ${String(n).padStart(2)}/${merged.length}  ${String(pct).padStart(3)}%  ${c}`);
}

// Pages with most findings
console.log('');
console.log('=== Top pages by finding count ===');
const byFindings = merged
  .filter(r => r.finding_ids_semicolon_delimited)
  .map(r => ({ slug: r.slug, count: r.finding_ids_semicolon_delimited.split(';').length, ids: r.finding_ids_semicolon_delimited }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);
for (const r of byFindings) {
  console.log(`  ${r.count}  ${r.slug}  [${r.ids}]`);
}

# Drift / Gap Report — Audit 2026-05-18

**Phase 9 (Core).** Compares the product surface (as enumerated from code + welcome-page claims) against the doc graph (inventory). Identifies Missing, Potential drift, and Orphaned content, then runs three named topic checklists at Core depth (category-level findings; not per-surface enumeration).

System graph extraction ran in **degraded mode** — no TS compiler available (no node). Routes and env vars derived via `ripgrep` patterns and direct file inspection. Mapping confidence is **Medium max** per the capability table.

## System graph (extracted)

### Product surface (per docs + welcome-page claims)

**Triggers** (documented as separate pages under `configuring-promptless/triggers/`):
- `git-hub-prs`, `git-hub-commits`, `git-hub-issues`
- `slack-messages`
- `microsoft-teams-messages`
- `intercom-tickets-beta`
- `api-triggers`

**Triggers claimed by welcome but missing a doc:**
- `releases` ("pull requests, commits, or releases change behavior")
- LaunchDarkly (implied by `launchdarkly-integration-beta`)

**Context sources** (under `configuring-promptless/context-sources/`):
- `confluence`, `jira`, `linear`, `notion`

**Integrations** (under `integrations/`):
- `github`, `github-enterprise`, `bitbucket`
- `slack`, `microsoft-teams`
- `atlassian` (covers Jira + Confluence)
- `linear`, `intercom-beta`, `launchdarkly-beta`

**Capabilities** (per welcome's six "What You Can Do" cards):
1. Update docs from code changes
2. Create new docs from context
3. Update docs from tickets and conversations
4. Create and maintain screenshots
5. Review and improve suggestions
6. Publish through your docs workflow (Mintlify, Fern, ReadMe, Docusaurus)

### Site-code env vars (Astro layer, not product surface — for completeness)

- `PUBLIC_POSTHOG_HOST`, `PUBLIC_POSTHOG_PROJECT_TOKEN` (PostHog)
- `PUBLIC_FREE_TOOLS_API_BASE_URL` (Broken Link Report)
- `SITE` / `SITE_URL` (Astro)
- GH-secrets: `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `DANGER_WRITE_PROD_DATABASE_URL`, `DOC_DETECTIVE_EMAIL`, `DOC_DETECTIVE_PASSWORD`

These belong to the marketing site, not the Promptless product. The *product's* env vars (e.g., `TEST_ACCOUNT_URL`, `TEST_ACCOUNT_USER`) appear in user-facing docs but lack a comprehensive reference. See Missing below.

## Drift sets

### Missing — in system graph, not in docs (mapping confidence in column)

| # | Entity | Why we know it exists | Where it should live | Mapping confidence |
|---|---|---|---|---|
| M1 | **GitHub Release trigger** | Welcome.mdx: "pull requests, commits, or releases change behavior that customers need to understand" | `configuring-promptless/triggers/github-releases.mdx` | High |
| M2 | **LaunchDarkly trigger** | `integrations/launchdarkly-integration-beta.mdx` exists; no trigger maps it to documentation events | `configuring-promptless/triggers/launchdarkly-flag-changes.mdx` (or similar) | Medium |
| M3 | **Env Vars reference page** | `managing-environment-variables.mdx` is procedural only — gives one example (`TEST_ACCOUNT_URL`); welcome-implied features (Capture, integrations) require many more variables not enumerated anywhere | `configuring-promptless/environment-variables-reference.mdx` (or extend the existing page with a reference table) | High |
| M4 | **Beta lifecycle / graduation policy** | Three slugs use `-beta` suffix: `intercom-tickets-beta`, `intercom-integration-beta`, `launchdarkly-integration-beta`. No policy doc explains what "beta" means, when features graduate, what guarantees apply | `getting-started/beta-and-feature-lifecycle.mdx` or as a section in welcome | High |
| M5 | **Pricing / tier feature matrix** | Pricing mentioned in 10 pages, mostly as "Enterprise plan" gates (audit logging, SSO/SAML, retention policies, self-hosting). Boundaries unclear without a side-by-side | `pricing/features.mdx` in docs (or link to `/pricing` page if it carries the matrix) | High |
| M6 | **Docs-platform integration notes** | Welcome explicitly names "Mintlify, Fern, ReadMe, Docusaurus" as supported docs-as-code targets. None has a dedicated page; users don't know what's different per platform | `integrations/docs-platforms/{mintlify,fern,readme,docusaurus}.mdx` (or a single docs-platforms reference) | Medium |
| M7 | **Webhook payload reference** | Webhooks referenced in github-enterprise, bitbucket, launchdarkly integration docs — but no shared payload schema page | `configuring-promptless/webhook-payloads.mdx` (reference) | Medium |
| M8 | **Capture full reference** | `using-promptless-capture.mdx` is the only doc; explains how to invoke. The capture configuration surface (env vars, target URLs, retry behavior, output paths) is not documented | Extend the existing doc OR new `configuring-promptless/promptless-capture-reference.mdx` | Medium |
| M9 | **Doc Detective integration discoverability** | `doc-collections/doc-detective-integration.mdx` exists but is filed under doc-collections; not in the `integrations/` tree where users would look first. The welcome doesn't mention it either | Cross-link or move into `integrations/doc-detective.mdx` | Low |

### Potential drift — in docs but possibly out of sync

These are *signals*, not confirmed drift. Confirmation requires comparing the doc against recent code/product changes (we don't have product-side history). Mapping confidence reflects suspicion strength.

| # | Page | Signal | Mapping confidence |
|---|---|---|---|
| D1 | `getting-started/pilot-overview` (hidden, 1007 words, 14d old) | Recent edits but hidden. Maybe the product moved past a "pilot" frame; maybe this is a sales-only doc never meant for nav | Low (no real-signal access this run) |
| D2 | `core-concepts/{,context-sources,doc-locations,triggers}` (4 stubs, 0 words, 82d old) | URL placeholders for content that hasn't materialized; the *system entities* (context sources, triggers, etc.) exist — placeholder mismatch | Medium |
| D3 | `frequently-asked-questions/recommended-docs-providers` (287w, hidden, 82d) | Has content but hidden; possibly written before a strategic decision to not endorse providers | Low |
| D4 | `intercom-tickets-beta`, `intercom-integration-beta`, `launchdarkly-integration-beta` | "Beta" status not time-bounded anywhere; possibly already GA without slug updates | Low (no product-side data) |

### Orphaned — in docs, no clear system mapping

None confirmed. The hidden stubs in D2 are technically orphans (no rendered output), but they map to system entities that *are* documented elsewhere; the stubs appear to be URL reservations for future content.

## Named topic checklists (Core depth: category-level only)

### Reference completeness

| Surface | Status | Note |
|---|---|---|
| API Triggers reference | ✓ Complete | `api-triggers.mdx` has shape, fields with types/required, error codes (401/409/422), one minimal + one realistic example |
| Env var reference | ✗ Missing | See M3 above. Only one example variable documented (`TEST_ACCOUNT_URL`) — likely 5–15+ are supported |
| Webhook payload reference | ✗ Missing | See M7. Three integration pages reference webhooks; no schema |
| CLI reference | n/a | SaaS product; no CLI |
| Permission/role reference | Partial | Concepts scattered across SSO, account-management, atlassian-integration; no concise reference |
| Configuration reference | ✓ Partial | Doc collections, triggers, context sources covered as separate pages; no umbrella config-reference page |
| Error catalog | ✗ Missing | Only API triggers documents error responses (3 codes); no general error catalog |

### Trust & safety (especially for AI products handling customer code)

| Surface | Status | Note |
|---|---|---|
| Data classification | ✓ Strong | `data-handling-and-classification.mdx` documents 3 categories cleanly |
| Storage vs. processing distinction | ✓ Clear | Explicit "stored" vs "processed, not stored" tables |
| Pre-training/fine-tuning use | ✓ Explicit | "Promptless does not use customer data for pre-training or fine-tuning language models" |
| What's sent to external models at inference | ⚠ Vague | Subprocessors page says "model-agnostic", lists OpenAI/Anthropic generally; doesn't specify retention or per-call data shape sent |
| Specific model providers | ⚠ Vague | "Tailored hosted models by cloud providers, such as OpenAI on Azure or Anthropic on AWS" — implies multi-provider, doesn't pin a default |
| Retention specifics | ⚠ Vague | "For the duration needed to provide the service" — not in days/hours |
| Audit logging | ✓ Documented | Enterprise feature; documented in compliance page |
| SSO/SAML | ✓ Documented | Enterprise feature |
| Data residency (region) | ⚠ Minimal | "Primary us-east-2, secondary US regions" mentioned; no EU residency option |
| GDPR / DSAR / right-to-delete | ✗ Not addressed | Not mentioned in security-and-privacy |
| HIPAA / SOC 2 / ISO certifications | ✓ Listed | In compliance-and-certifications |
| Permissions model (RBAC) | ⚠ Partial | Roles mentioned in setup/account but no concise model |

**Significant in this category:** the "what's sent to which model when" question — a security reviewer's number-one question — is answered with "we're model-agnostic" rather than "here's the data shape and retention contract you can take to your CISO". For an AI product touching customer code, this is the most concrete shoring-up opportunity.

### Release / migration / deprecation

| Surface | Status | Note |
|---|---|---|
| Versioning model | ✗ Missing | `promptless-1-0` exists as a launch announcement; no doc on "how we version" |
| Current vs. prior behavior | n/a | No documented prior behavior to compare against |
| Deprecation timeline | ✗ Missing | No deprecation page; no "scheduled for removal" callouts |
| Migration guide | ✗ Missing | No migration guide for the 1.0 transition; OSS page exists separately |
| Beta lifecycle | ✗ Missing | See M4 — three `-beta` items lack a graduation policy |
| Breaking-change communication channel | ⚠ Implied | The changelog (`src/content/changelog/` — out of audit scope) presumably carries this; should be linked from the docs |

## Phase 9 → downstream handoff

- The Missing items M1, M3, M5 (Release trigger, Env vars reference, pricing matrix) directly feed Phase 13's journey audit — they're "Configure" and "Evaluate" stage blockers.
- The Trust & Safety "what's sent to models" gap is the highest-priority finding for the security-reviewer persona walk in Phase 13.
- The Beta lifecycle gap (M4) is the kind of finding that's cheap to fix (one page) but high-value for buyer due diligence.

## Findings written

Working notes captured in [findings.md](findings.md#phase-9--drift--gap--named-checklists).

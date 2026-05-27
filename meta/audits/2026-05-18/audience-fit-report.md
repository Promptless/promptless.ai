# Audience Fit Report — Strategy Level Only

**Phase 12 (Expanded).** The persona-validation gate was not opened by the user, so this report is restricted to **strategy-level findings only** per the plan: *"If the user declines to validate or skips, Phase 12 produces strategy-level findings only — never per-page persona-mismatch findings."* No per-page persona-mismatch findings are emitted.

The persona inventory below is **auto-derived from the product surface** (welcome page + integrations list + security pages + product nouns). It is **not validated** by a stakeholder. Treat it as a working hypothesis, not policy.

## Provisional persona inventory (auto-derived, unvalidated)

| ID | Persona | Role | Primary tasks via Promptless | Vocabulary level | Expected starting context | Source of evidence | Confidence |
|---|---|---|---|---|---|---|---|
| P1 | **Technical Writer (TW)** | Owns the docs; primary user | Configure triggers, review suggestions, manage doc collections, tune Capture | High (knows MDX, doc tooling) | Has the docs already; wants to automate maintenance | `welcome.mdx` framing: "AI agent built to support technical writers"; `agent-knowledge-base.mdx` | High |
| P2 | **Engineering / DevRel lead** | Connects Promptless to repos and triggers | Set up GitHub integration, configure PR/commit triggers, API triggers | High (CLI, CI/CD, git fluent) | Owns deployment pipelines; new to docs tooling | Trigger pages, API integration content, `setup-quickstart` "permissions" callout | High |
| P3 | **Support / CX manager** | Routes customer questions into docs updates | Configure Slack and Intercom triggers; review docs that come from tickets | Medium (Slack-fluent, light on MDX) | Owns ticket flow; new to docs tooling | "Update docs from tickets and conversations" capability card; Slack-messages, Intercom-tickets-beta triggers | Medium |
| P4 | **Security / Compliance reviewer** | Approves Promptless adoption for the org | Validate data handling, subprocessor list, SSO/SAML, audit logging | High (regulated industry vocabulary, asks about retention/redaction) | Procurement gate; not a hands-on user | The entire `security-and-privacy/*` section exists for this persona | High |
| P5 | **Ops / Platform engineer** | Self-hosts Promptless | Helm, Kubernetes, env vars, secrets | High (k8s-fluent) | Self-hosting requirement; less interested in SaaS UX | `self-hosting/kubernetes-helm.mdx` (currently hidden) | Medium |
| P6 | **OSS maintainer** | Uses the OSS edition | Promptless OSS workflows, contributing docs back | High (devrel / OSS-fluent) | Free-tier or community user; less procurement friction | `getting-started/promptless-oss.mdx`, Write the Docs Portland 2026 blog tie-in | Medium |

**Six personas total.** P1 and P2 are the primary product audience; P4 is the buyer-gate persona; P3 / P5 / P6 are secondary.

## Persona × Good Docs page-type coverage matrix

Cells show approximate page count serving each cell (counted from Phase 11 classification + manual inspection). Empty / thin cells are **strategy gaps** (always valid findings, regardless of persona validation).

| Persona ↓ × Page type → | concept | quickstart | how-to | reference | troubleshooting | release notes / migration |
|---|---|---|---|---|---|---|
| **P1 Tech Writer** | core-concepts (stubs), promptless-1-0 | setup-quickstart shared | how-to-use-promptless/* (8) | account-management; managing-env-vars | **∅** | **∅** |
| **P2 Engineer / DevRel** | welcome, core-concepts (stubs) | setup-quickstart | triggers/* (7); integrations/* (10) | api-triggers; doc-collections/* | github-enterprise (partial) | **∅** |
| **P3 Support / CX** | (none persona-specific) | (none) | slack-messages; intercom-tickets-beta | (overlaps with P2 trigger pages) | **∅** | **∅** |
| **P4 Security / Compliance** | (none) | (none) | sso-setup | compliance-and-certifications; data-handling; subprocessors; network-architecture; privacy-policy | **∅** | **∅** |
| **P5 Ops / Platform** | (none) | (none) | self-hosting/kubernetes-helm (hidden) | (none) | self-hosting troubleshooting accordion (1 page) | **∅** |
| **P6 OSS maintainer** | promptless-oss | (shares setup-quickstart) | (none persona-specific) | (none) | **∅** | **∅** |

## Strategy-level findings (valid without persona validation)

These are about whole rows/columns being thin or empty. They do not require the user to have validated the personas, because they're observations about **page-type coverage**, not per-page persona scoring.

### S-A — Troubleshooting column is essentially empty across all 6 personas
Only `self-hosting/kubernetes-helm.mdx` has a real troubleshooting section (AccordionGroup). Five of six personas have **no** troubleshooting content. Already escalated as F-0025 in Phase 13; this lens corroborates that finding from a different angle.

### S-B — Release-notes / migration column is empty across all 6 personas
No persona has anywhere to look for "what changed", "what's deprecated", or "how do I migrate to the new version". Already escalated as F-0013; corroborated here.

### S-C — Persona P3 (Support / CX) has almost no persona-specific content
P3's only persona-specific docs are the Slack and Intercom trigger pages — both of which read like configuration guides, not support-team-oriented guides. There is no "Support team workflow with Promptless" page that walks through ticket-cluster-to-docs-update.

### S-D — Persona P5 (Ops / Platform) is in scope but hidden
The single page that serves P5 (`self-hosting/kubernetes-helm.mdx`) is in `sidebar.hidden: true` mode. Either P5 is not an active sales target (in which case the hidden status is correct but the page should be archived or moved elsewhere), or P5 IS a target and the page should be unhidden (the inventory finding W1-05 already flagged this from a different angle).

### S-E — Persona P4 (Security / Compliance) has reference coverage but no journey
P4 has the most reference content (5 pages) but no concept page that explains the security model end-to-end and no troubleshooting for compliance edge cases (data residency, breach response, etc.). The W9-03 / W13-06 walls (per-call model transfer; GDPR) hit this persona hardest.

### S-F — No persona has a quickstart of its own
Only `setup-quickstart.mdx` exists, and it's persona-neutral. A persona-specific quickstart for at least P1 (Tech Writer) and P2 (Engineering lead) would address different starting contexts (a TW already has docs and wants automation; an engineer is setting up integrations to fire triggers).

## Patterns (the only thing that should bubble to findings.md)

1. **Troubleshooting is the most under-served page type across personas** (already F-0025; this corroborates).
2. **Maintain/update lifecycle is missing from every persona's experience** (already F-0013; this corroborates).
3. **Three personas (P3 Support, P5 Ops, P6 OSS) have one or zero persona-specific pages each** — opportunity for targeted content.
4. **Persona-specific quickstarts do not exist** — one quickstart serves all personas, which is a journey-cliff for at least P1 and P2 whose starting contexts differ.
5. **Persona inventory itself is the most important deliverable from Phase 12.** Stakeholder validation (or revision) of the six personas would unlock per-page scoring in a future run.

## What's deliberately NOT in this report

- Per-page persona assignments (would require validated personas)
- Per-page persona-mismatch findings (same gate)
- Vocabulary / assumption / task-orientation / voice checks against specific personas (same gate)
- A recommendation to migrate to persona-based IA (Phase 2 decision #11 — diagnostic only by default; no migration recommendation without explicit opt-in)

# Journey & Task Success Report — Audit 2026-05-18

**Phase 13 (Core).** Audits whether a real user with a real goal can succeed *through the docs* — not whether the right pages exist, but whether the path from arrival to outcome is walkable.

This run had **no live signal access** (no PostHog dashboard, no support data, no analytics aggregates). All findings are derived from inspection and are tagged `evidence: inferred`. Maximum confidence on per-page findings is **Medium**. The findings about coverage gaps (whole journey stages, missing decision support) are higher-confidence because they're presence-or-absence checks.

## Journey-stage coverage

| Stage | Pages serving it | Coverage call | Notes |
|---|---|---|---|
| 1. **Discover** | `welcome.mdx`, `promptless-1-0.mdx`, marketing site | ✓ Strong | 621-word welcome with video, 6 capability cards, "How it Works" diagram + Steps. 5 "Common Starting Points" link cards. |
| 2. **Evaluate** | `security-and-privacy/*`, `pricing` (marketing), `core-concepts.mdx` | ⚠ Significant gaps | No tier feature matrix in docs (W9-05). Trust-and-safety has the model-specifics gap (W9-03). Self-hosting hidden — buyers can't see it. Pilot-overview hidden. Beta lifecycle policy missing (W9-04). |
| 3. **Install / connect** | `setup-quickstart.mdx`, integration pages | ✓ Mostly strong | Quickstart calls out required permissions per integration; explains team handoff for permissions. 6-step guided wizard shown. Minor gap: verification of each step is implicit. |
| 4. **First success** | (no dedicated page) | ✗ **Significant gap** | The quickstart ends at "Start trial" — not at "Promptless made its first suggestion". The first-success moment (a Promptless-authored PR) is not articulated anywhere. No "Promptless will produce its first PR within X minutes" promise. Users complete setup and then have no orchestrated path to value. |
| 5. **Configure** | `configuring-promptless/*` (17 pages) | ⚠ Solid breadth, but env-var reference missing (W9-01); customizing-notifications exists | The configuration surface is well-decomposed (triggers + context-sources + doc-collections). Missing: env vars reference, webhook payload schemas (W9-07/M7). |
| 6. **Troubleshoot / recover** | 16 pages contain troubleshooting language; no top-level index | ⚠ Coverage exists but uneven | No `troubleshooting/` section in nav. Verification language is sparse (11/59 pages) — most procedures don't say how to confirm they worked. Best example: `self-hosting/kubernetes-helm` (9 verification cues, AccordionGroup with common issues). |
| 7. **Scale / mature** | Enterprise features documented; multi-team / governance / performance thin | ⚠ Moderate gaps | Audit logging ✓, SSO ✓, custom retention ✓ (all Enterprise). No multi-team / org-shape content; no performance / rate-limit reference. |
| 8. **Maintain / update** | None | ✗ **Significant gap** | No versioning model. No deprecation page. No migration guide. No "current vs prior behavior" coverage. `promptless-1-0.mdx` is a launch announcement, not a maintain-and-upgrade page. |

**Stage-coverage signal:** Discovery and Install are strong; Evaluate, First Success, and Maintain have significant gaps. The pattern is typical for an early-stage AI product — they nailed the marketing front and the install procedure, but haven't yet built the lifecycle infrastructure that handles "what happens after I sign up" or "how do I upgrade safely."

## Task success criteria — major docs

Mechanical major-doc set per the plan: every quickstart, every how-to/tutorial, every integration page, every setup/install/auth/self-hosting page, every getting-started page, every API/config-reference page. For this docs set, this resolves to **~33 of the 59 pages**.

Sampled assessment (12 pages spot-checked; full audit would extend to all 33):

| Page | Asks success criterion explicitly? | Notes |
|---|---|---|
| `getting-started/welcome` | No | Discovery page; not a task |
| `getting-started/setup-quickstart` | Partial | Ends at "Start trial" rather than "first PR opened" |
| `getting-started/promptless-oss` | Unknown | Spot-check pending |
| `how-to-use-promptless/working-with-slack` | Partial | 4 `<Steps>` blocks; first one ("@mention Promptless in a channel") is verifiable; later steps less so |
| `how-to-use-promptless/managing-environment-variables` | ✓ | "Click Save to store your environment variables" + Frame screenshot |
| `how-to-use-promptless/using-promptless-capture` | Partial | 2 `<Steps>`; verification cues mentioned twice |
| `how-to-use-promptless/agent-knowledge-base` | (orphan; W1-01) | Page exists but unlinked from nav |
| `configuring-promptless/triggers/api-triggers` | ✓ | API response codes documented (202 Accepted) + error responses |
| `configuring-promptless/triggers/git-hub-prs` | Partial | Steps but no verification of "PR is being watched" |
| `integrations/github-integration` | Partial | Hub page; 6 inbound links — high traffic, would benefit most from a verification section |
| `integrations/slack-integration` | Partial | 5 inbound — same as above |
| `self-hosting/kubernetes-helm` | ✓ Strong | Multiple verification commands; AccordionGroup with troubleshooting |

**Pattern:** Strong success-criteria are concentrated in technical reference pages (API triggers, kubernetes-helm) where the audience expects them. Weaker in the user-facing how-to pages where users actually need them most.

## Onboarding gradient

```
welcome (621w, video, capability cards)        ←  Beginner entry, well-orchestrated
   ↓
setup-quickstart (with permissions table)       ←  Solid; assumes guided-setup wizard works
   ↓
first integration (Slack or GitHub)              ←  Documented; specific platform pages
   ↓
configure-first-trigger                          ←  Page exists; depends on prior integration
   ↓
                  [GAP]                          ←  No "you've configured a trigger, now what?"
   ↓
advanced: agent-knowledge-base                   ←  ORPHAN (W1-01); intermediate users can't reach this from nav
                  +
       deep-analysis, env vars (partial)
   ↓
                  [GAP]                          ←  No mastery path; pilot-overview hidden
```

**Gradient cliffs:**
1. Between "configured first trigger" and "made first edit to a Promptless suggestion" — no orchestrated next step.
2. Between "basic Slack mention" and "deep analysis / agent knowledge base" — the bridge pages are orphaned or thin.
3. Between "I'm using the trial" and "we should expand to the whole team" — no scaling content.

## Troubleshooting & recovery coverage matrix

For each high-traffic feature, is there at least a "When it doesn't work" section?

| Feature | Has troubleshooting? | Depth |
|---|---|---|
| Quickstart / install | Partial — `getting-help.mdx` is general | Generic; not failure-mode oriented |
| Slack integration | No specific troubleshooting section in `slack-integration.mdx` (some in `working-with-slack.mdx`) | Mostly happy-path |
| GitHub integration | Some in `github-enterprise-integration.mdx` (webhooks); main `github-integration.mdx` is happy-path | Uneven |
| API triggers | Error codes documented (401/409/422) ✓ | Good for the trigger; nothing for upstream auth issues |
| Self-hosting (kubernetes) | ✓ Strong — AccordionGroup with common pod failures, log inspection commands | Best example |
| Promptless Capture | No troubleshooting section | Missing — capture failure modes (browser eval, auth, target unreachable) not documented |
| Doc collections (GitHub repos) | No troubleshooting section | Missing |
| Context sources (Confluence/Jira/Linear/Notion) | No troubleshooting sections | Auth failures, scope issues, slow indexing not addressed |

**Pattern:** The self-hosting/Kubernetes audience gets the best troubleshooting (because ops engineers need it); the SaaS path — which is most users — gets the thinnest treatment. Inverted from what user volume implies.

## Decision support

Phase 2 (IA) is not running this round; this section is self-contained per the plan.

Axes of choice the product surface implies, vs. content addressing them:

| Decision axis | Page that helps user choose? |
|---|---|
| Trigger: Slack message vs GitHub PR vs API call | ✗ No comparison page |
| Hosted vs Self-hosted | ✗ Self-hosting page is hidden; no comparison |
| Context source: Confluence vs Notion (similar use) | ✗ No comparison |
| Context source: Jira vs Linear | ✗ No comparison |
| Manual (Slack @mention) vs Automatic (PR trigger) | ✗ No "when to use which" guidance |
| Beta vs GA integration | ✗ Beta lifecycle policy missing (W9-04) |
| Docs platform: Mintlify vs Fern vs ReadMe vs Docusaurus | ✗ Welcome names them; no per-platform notes (W9-06) |
| OSS vs Cloud (Promptless OSS appears as a getting-started page) | ⚠ `promptless-oss.mdx` exists; no comparison to cloud |

**Pattern:** The product surface implies ~8 decision points; the docs help with ~0. Users default to the path of least resistance (or to support requests), which masks the question of which path is *right* for their use case.

## Trust & safety walkthrough — security-reviewer persona simulation

Imagining a security/compliance reviewer landing on `/docs` and trying to answer:

| Question | Path that answers it | Friction |
|---|---|---|
| What does Promptless do? | `welcome.mdx` | None |
| What data does it touch? | `data-handling-and-classification.mdx` | Clean tables, good |
| What's sent to external models, when? | `promptless-subprocessors.mdx` | **Vague — "model-agnostic" rather than per-trigger transfer spec.** W9-03. |
| Where is data stored? | `subprocessors.mdx` mentions us-east-2 | Single region; no EU residency clarity |
| GDPR compliance? | Not addressed | ✗ Reviewer hits wall |
| SOC 2? | `compliance-and-certifications.mdx` | ✓ |
| Audit logs? | `compliance-and-certifications.mdx` | ✓ |
| SSO / SAML? | `single-sign-on-sso-setup.mdx` | ✓ |
| DPA? | Not in docs | ✗ Reviewer must request |
| Subprocessor list with regions? | `subprocessors.mdx` | Partial — categories not pinned vendors |

**Result:** A security reviewer can answer ~60% of their questions inside the docs and must contact sales/security for the rest. Two of the gaps (model-specifics and GDPR) are the kind that can sink an enterprise deal at the security-review stage. **W9-03 is correctly Critical** for this persona.

## Procedural accuracy (Doc Detective sub-lens; absorbs former Phase 8)

The synthesis-pass refactor moved Doc Detective from a separate Phase 8 lens into Phase 13 as the *procedural-accuracy* sub-lens. Rationale: pass/fail of documented procedures is task-success evidence (same shape as DARI's stuck-at-step output), not a separate measurement.

### Discovery (this run)

| Source | Result |
|---|---|
| `.doc-detective/tests/*.spec.json` | **1 spec file** (`login.spec.json`) — tests the Clerk auth flow; does not map to any documented procedure |
| Inline test markers in MDX bodies (`{ *doc-detective ... }`, `<!-- doc-detective ... -->`) | **0 markers** across all 59 pages (confirmed via Node fs scan, not rg) |
| `<Steps>` procedure blocks | **17 procedures across 10 pages** (the population) |

### Coverage

| Metric | Value |
|---|---|
| Documented procedures | 17 |
| Procedures with a Doc Detective test (spec or inline) | **0** |
| Procedural-accuracy coverage | **0%** |
| Procedural-accuracy pass rate | n/a (no tests to fail) |

### Page-level procedure load

10 pages carry one or more documented procedures:

| Procedures | Page |
|---|---|
| 4 | `docs/how-to-use-promptless/working-with-slack` |
| 2 | `docs/getting-started/pilot-overview` (hidden) |
| 2 | `docs/how-to-use-promptless/using-promptless-capture` |
| 2 | `docs/integrations/atlassian-integration` |
| 2 | `docs/self-hosting/kubernetes-helm` (hidden) |
| 1 each | `welcome`, `deep-analysis`, `interacting-with-promptless-p-rs`, `managing-environment-variables`, `github-enterprise-integration` |

### Interpretation

The headline question for this sub-lens isn't *"are there tests?"* (1 spec file exists) — it's *"do the documented procedures actually work as written?"* That question is **unanswered** for all 17 procedures because none have a Doc Detective test, inline or spec. F-0006 carries this finding under Phase 13 going forward.

Per-page Doc Detective data is captured in [`evidence/page-data.csv`](evidence/page-data.csv) columns `dd_steps_block_count`, `dd_inline_marker_count`, `dd_test_covered`. The execution columns (`dd_test_passed`, `dd_test_failed`, `dd_last_run`) are blank this run and become populated when the workflow runs with credentials.

### Agent task-success simulation (DARI sub-lens)

Spec only this run (tooling-spec S14). When DARI runs, its per-task stuck-at-step data joins this report and the `dari_*` columns in `page-data.csv` populate.

## Phase 13 → Phase 14 inputs

Top journey-level findings to escalate:
- **First Success orchestration missing** (Stage 4) — Significant
- **Maintain/update lifecycle missing** (Stage 8) — Significant
- **Decision support absent across ~8 axes of choice** — Significant
- **Troubleshooting inverted: SaaS path thin, self-hosting strong** — Moderate
- **Security reviewer hits two walls in T&S walkthrough** — already escalated as W9-03 Critical

## Findings written

See [findings.md](findings.md#phase-13--journey--task-success) for the formal entries.

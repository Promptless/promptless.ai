---
id: cuj-calibrate-suggestions
type: cuj
title: Calibrate suggestion noise, volume, and release timing
personas: [persona-scaleup-solo-writer, persona-eng-docs-owner, persona-enterprise-docs-lead, persona-devrel-owner, persona-brownfield-docs-lead]
trigger: "First suggestions are too noisy, too early, or firing on the wrong changes; the champion needs to tune signal-to-noise before trust erodes."
entry_point: /docs/how-to-use-promptless/providing-feedback
success_criteria: "Suggestions arrive at the right time (after a feature actually ships), at a manageable volume, scoped to externally-relevant changes — and the team trusts the queue."
steps:
  - { stage: "Suppress internal-only / irrelevant changes", doc: "/docs/configuring-promptless/suggestion-filtering", exists: false, note: "[GAP] No dedicated noise/relevance-tuning page" }
  - { stage: "Align drafting to release timing / feature flags", doc: /docs/integrations/launchdarkly-integration-beta, exists: partial, note: "LaunchDarkly exists; general release-timing/feature-flag model not documented" }
  - { stage: "Map release stage to suggestion status", doc: "/docs/configuring-promptless/release-timing", exists: false, note: "[GAP] Recurring unsolved workflow across many accounts" }
  - { stage: "Teach conventions via feedback", doc: /docs/how-to-use-promptless/providing-feedback, exists: true }
  - { stage: "Tune notification volume/routing", doc: /docs/configuring-promptless/customizing-notifications, exists: true }
---

# CUJ: Calibrate suggestion noise, volume, and release timing

**Scope:** Tuning signal-to-noise after first suggestions appear. **This is where pilots are
won or lost** — it recurs in nearly every customer call.

**Trigger.** The first batch is noisy (self-evident UI changes, refactors flagged as "new",
internal-only PRs), arrives before a feature ships, or buries the team.

**Narrative.** Two distinct problems dominate the corpus. (1) **Noise**: false positives and
internal-vs-external changes overwhelm the team — some customers wanted internal-only changes
suppressed; others wanted merge-only triggers or feature-flagged content excluded. (2)
**Release timing**: drafting must fire when a feature *actually ships*, not when code merges
behind a flag — one enterprise customer drafted release notes "too early"; mapping **release stage →
suggestion status** is the most-cited unsolved workflow problem in the entire dataset.

**Current friction / gap.** There is **no noise/relevance-tuning page and no release-timing /
feature-flag model page.** The LaunchDarkly integration is the closest artifact but doesn't
cover the general pattern. These are the highest-value content gaps for retention.

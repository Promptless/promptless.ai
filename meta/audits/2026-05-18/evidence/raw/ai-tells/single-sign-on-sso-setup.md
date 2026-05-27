# AI Tells Detection Report

**Scope:** `src/content/docs/docs/security-and-privacy/single-sign-on-sso-setup.mdx`
**Word count:** ~464 (body prose)
**Genre baseline:** Enterprise SSO setup guide — formal procedural prose, somewhat marketing-tinged due to "enterprise" framing. Some tells conventional.

## Findings

1. **Category:** Vocabulary fingerprints
   **Tell:** Three AI-vocab fingerprints in one sentence (opening)
   **Quote:** "enables enterprise organizations to authenticate users through their existing identity provider, streamlining access management and enhancing security across your documentation workflow"
   **Location:** line 9 (first prose sentence)
   **Confidence:** high

2. **Category:** Vocabulary fingerprints
   **Tell:** "leverage" — overrepresented in LLM corporate prose
   **Quote:** (instance flagged by heuristic scan in evidence/raw/ai-tells/_aggregate.json)
   **Location:** body
   **Confidence:** medium

3. **Category:** Vocabulary fingerprints
   **Tell:** "seamless" / "seamlessly" — overrepresented in LLM marketing prose
   **Quote:** body usage flagged by aggregate scan
   **Location:** body
   **Confidence:** medium

4. **Category:** Tonal/voice tells
   **Tell:** Vague "industry-standard" + "Modern authentication protocol" hedge cluster
   **Quote:** "Promptless supports enterprise authentication through industry-standard protocols" / "Modern authentication protocol supporting Google Workspace, Azure AD..."
   **Location:** lines 13, 17
   **Confidence:** medium

5. **Category:** Structural over-optimization
   **Tell:** 11 bold-header colon-bullets — far above the typical ratio of bolded-name-then-description bullets on this docs set
   **Quote:** "**SAML 2.0**: Compatible with enterprise identity providers...", repeated pattern
   **Location:** throughout
   **Confidence:** medium

6. **Category:** Structural over-optimization
   **Tell:** Inline HTML `<section class="pl-site-step">` markup instead of the `<Steps>` Astro component used everywhere else on the docs set
   **Quote:** `<article class="pl-site-step" id="collect-identity-provider-information">`
   **Location:** lines 32+
   **Confidence:** medium (this could be a deliberate styling decision; flag for human review of why this page departs from the convention)

## Category tallies

| Category | Hits |
|---|---|
| Vocabulary fingerprints | 3 |
| Sentence patterns | 0 |
| Structural over-optimization | 2 |
| Statistical signatures | 0 |
| Tonal/voice tells | 1 |
| Hallucination markers | 0 |
| Closing patterns | 0 |

## Cluster verdict

**moderate** — 6 tells across 4 categories. Opening sentence is the strongest single signal (three AI-vocab fingerprints in one breath: "streamlining", "enhancing", "across your documentation workflow"). Combined with the bold-bullet density and the markup inconsistency, this page reads as more AI-assist-heavy than the rest of the security section.

## Caveats

- Enterprise SSO documentation is marketing-adjacent in any tech company; formal vocabulary is partially genre-conventional.
- 11 bold-header bullets may be a deliberate "feature-comparison" format choice, not an AI tell.
- The HTML `<section class="pl-site-step">` markup may be a remnant of a different docs-platform import (e.g., manually migrated from another system); could indicate human migration work, not AI generation.
- Page is single-committer + 1-commit (W10 ownership signal) and is one of the 3 pages overdue per proposed freshness cadence (82d for High-risk class with 60d cadence). Combining ownership + AI-tell signals: this is a candidate for refresh, not necessarily for "this is AI" verdict.

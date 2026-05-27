# AI Tells Detection Report

**Scope:** `src/content/docs/docs/configuring-promptless/triggers/api-triggers.mdx`
**Word count:** ~330 (body prose only; excluding code blocks and tables)
**Genre baseline:** API reference doc — terse, procedural, imperative voice. Tells are rare in this genre; bold-header bullets and tricolons may be conventional.

## Findings

1. **Category:** Structural over-optimization
   **Tell:** Bold-header colon-bullet pattern in Key Management list
   **Quote:** "**One active key per organization**: Each organization can have one active API key..."
   **Location:** lines 49–51
   **Confidence:** low

2. **Category:** Statistical signatures
   **Tell:** Em-dash density just below threshold (2 in ~330 words ≈ 1.8 per 300)
   **Quote:** "Copy the key immediately—it's only shown once"
   **Location:** lines 41, 73
   **Confidence:** low

## Category tallies

| Category | Hits |
|---|---|
| Vocabulary fingerprints | 0 |
| Sentence patterns | 0 |
| Structural over-optimization | 1 |
| Statistical signatures | 1 |
| Tonal/voice tells | 0 |
| Hallucination markers | 0 |
| Closing patterns | 0 |

## Cluster verdict

**weak** — 2 tells across 2 categories; both low-confidence and consistent with API-reference genre conventions. No basis for inferring AI authorship.

## Caveats

- API reference is a high-structure genre — bold-header bullets and parallel listing are conventional, not tells.
- The `<Note>` admonition at the end is a Starlight component used across the docs, not an AI-style boilerplate kicker.
- Page is single-committer + 2-commit (W10 ownership signal), but ownership data is a separate axis from AI-tells.

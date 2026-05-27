# AI Tells Detection Report

**Scope:** `src/content/docs/docs/security-and-privacy/data-handling-and-classification.mdx`
**Word count:** ~530 (body prose; excludes table cells)
**Genre baseline:** Security/compliance prose — formal vocabulary, hedging, parallel structure all conventional. Tells partially expected.

## Findings

1. **Category:** Vocabulary fingerprints
   **Tell:** Buzzword cluster — "robust", "comprehensive", "multi-layered"
   **Quote:** "Our multi-layered approach to security encompasses data encryption, access controls, and robust authentication mechanisms"
   **Location:** line 78
   **Confidence:** medium

2. **Category:** Vocabulary fingerprints
   **Tell:** "robust authentication mechanisms" — overrepresented in LLM corporate output
   **Quote:** "Our platform provides robust authentication mechanisms for all users"
   **Location:** line 44
   **Confidence:** medium

3. **Category:** Sentence patterns
   **Tell:** Tricolon closing — three-element list ending the document
   **Quote:** "encompasses data encryption, access controls, and robust authentication mechanisms"
   **Location:** line 78
   **Confidence:** medium

4. **Category:** Structural over-optimization
   **Tell:** Bold-header colon-bullet pattern, used uniformly across three storage-class lists
   **Quote:** "**Documentation Copies**: Promptless stores copies of your documentation…"
   **Location:** lines 22–24
   **Confidence:** low (this format is also a Starlight convention)

5. **Category:** Tonal / voice tells
   **Tell:** Default-assistant register — generic positivity, "industry-standard" hedge
   **Quote:** "Two-factor authentication (2FA) support using industry-standard TOTP"
   **Location:** line 47
   **Confidence:** medium

6. **Category:** Closing patterns
   **Tell:** Boilerplate kicker — paragraph at the very end that restates the doc's premise without new content; appears AFTER the "Questions About Data Handling?" CTA, so it's structurally out of place
   **Quote:** "Promptless implements comprehensive security measures to protect customer data and ensure secure access to our platform. Our multi-layered approach to security encompasses…"
   **Location:** line 78
   **Confidence:** high

## Category tallies

| Category | Hits |
|---|---|
| Vocabulary fingerprints | 2 |
| Sentence patterns | 1 |
| Structural over-optimization | 1 |
| Statistical signatures | 0 |
| Tonal/voice tells | 1 |
| Hallucination markers | 0 |
| Closing patterns | 1 |

## Cluster verdict

**moderate** — 6 tells across 5 categories. The trailing boilerplate paragraph (line 78), placed *after* the contact-us CTA, is the strongest single signal. Combined with the buzzword cluster ("robust" + "comprehensive" + "multi-layered" appearing in one sentence), this warrants human review of at least the closing paragraph.

## Caveats

- Security/compliance writing genuinely uses formal vocabulary and parallel structure — calibrate against the genre baseline before treating the bold-header bullets as a tell.
- The page is single-committer + 2-commit (W10 ownership signal), so the same author who wrote the body also wrote the trailing paragraph; AI-tells reflect possible AI-assist, not necessarily fully-generated content.
- "Industry-standard" + "modern" + "major" attributions are vague but factually defensible in this context (TOTP genuinely is an industry standard).
- The trailing summary is also a common pattern in security policy docs that mirror marketing tone for buyer reassurance — could be a deliberate stylistic choice, not an AI artifact.

---
name: agent-docs
description: Use this skill when the user wants to audit, review, or improve documentation for AI agent consumption. Covers: page titles, self-contained sections, error documentation, code examples, section length, context compression, terminology consistency, and cross-file single points of failure.
version: 1.0.0
---

# Auditing Documentation for AI Agents

Reference guide for evaluating and improving docs so AI agents can consume them reliably.

---

## Page Titles

Agents select which pages to fetch based on title alone — no body text is visible at search time. A vague or marketing-flavored title means the agent may skip the page entirely.

- Titles should describe the specific content of the page, not the product ("Setup & Quickstart" not "Get Started", "Welcome to Promptless" not "Your Docs on Autopilot")
- Avoid duplicate titles across pages ("Overview", "Overview") — agents can't distinguish them

---

## Self-Contained Sections

Agents frequently receive a single section or page without surrounding context. Forward/backward references break this.

- Avoid "see above," "as described earlier," "same as before," "refer to the previous section"
- Restate the critical bits inline — prerequisites, key constraints, required permissions — not the whole page, just what's needed to act on this section
- Expandable sections work only if the content is static HTML that's visually hidden. Content loaded dynamically on click is invisible to agents. When in doubt, put critical info in the main flow

---

## Error and Failure Documentation

Agents struggle when error information is absent and will hallucinate resolutions. Structured failure docs are one of the highest-leverage improvements.

- Add a troubleshooting or debugging section to any page where setup or configuration can fail
- Quote error codes and error strings exactly as they appear in the product — never paraphrase
- Document known edge cases, "won't fix" limitations, and non-obvious constraints
- For "coming soon" features: clearly label them as unavailable so agents don't treat them as current capabilities

---

## Code Examples

For docs with a code/API surface, code examples matter more than prose descriptions. Stripping examples can collapse LLM task success rates by 40–60 percentage points.

- Prioritize examples for the steps most likely to fail or be misused
- Add inline comments to each example explaining its intent — helps agents distinguish correct examples from near-misses, and instruction steps from demonstration code
- Diverse examples (different parameters, edge cases) outperform many similar ones
- Never invent examples from memory. If the source isn't available, leave a placeholder rather than guessing

---

## Section Length and Structure

Long, prose-heavy pages degrade faster for complex tasks than for simple lookups.

- For complex multi-step workflows: keep pages shorter; break by phase if needed
- For reference pages (parameter tables, error codes): length is fine
- Use structured formats for constraints and defaults — tables, callouts, `must`/`should`/`must not` — not buried prose
- Use explicit importance signals ("required," "optional," "critical," "forbidden") on high-value content; these survive context compression better than narrative prose

---

## Terminology — Product-Specific Terms Only

Inconsistent naming for product-specific terms forces agents to guess whether two terms are the same concept or different ones.

**What to flag:** Named features, UI labels, and API concepts that have a precise meaning in this product — things that are capitalized as proper nouns, appear in the product UI, or are explicitly defined somewhere in the docs. Swapping them with a synonym would cause a user to look for the wrong thing or configure the product differently.

**What not to flag:** Generic English synonyms ("repo" vs "repository", "PR" vs "pull request", "docs" vs "documentation"). Variation in everyday language is normal and not a problem.

When in doubt: ask "if these two terms were swapped, would a user configure the product differently or look for the wrong thing in the UI?" If yes, flag it. If no, ignore it.

---

## Cross-File Single Points of Failure

Only flag a concept as a cross-page risk if it passes **all three** of these tests:

1. It is a hard blocker or silent failure risk (not just "nice to know")
2. A user following a *different* page would plausibly hit it without warning
3. It is genuinely surprising — not something a user would naturally anticipate

Most facts are correctly on one page. Flag sparingly. Do not flag: compliance statements, pricing, marketing claims, or workflow details that are self-contained to their own section.

---

## MCP Tool Descriptions

If the product exposes an MCP server, tool descriptions are first-class docs.

- Write descriptions from the user's task perspective ("what does this accomplish?"), not the implementation's ("how does this work?")
- Agents select tools based on semantic match to the user's query — a clear, task-oriented description beats a technically accurate but opaque one
- Apply the same product-specific terminology consistency rule above

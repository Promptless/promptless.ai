# Agent Docs Audit

Audit documentation for AI agent readiness and produce a short, prioritized fix list.

Grounded in [A Practical Guide on How to Optimize Your Docs for Agents](https://www.promptless.ai/blog/technical/agent-docs).

## Usage

```
/docs-audit [hint]
```

- `hint` — optional directory name or keyword. If provided, search for a matching directory and audit only that subtree. If not provided, search from the current working directory.

**Philosophy**: Surface only things that will cause real failures or meaningful degradation for agents. Skip style preferences. Do not report issues that are merely suboptimal.

---

## Step 1: Discover pages

If a hint was provided, find the best-matching directory in the repo and search recursively under it. If no hint was provided, search recursively from the current working directory.

Exclude:
- Changelog and release note files
- Files under `node_modules`, `.git`, or build output directories
- Blog posts and marketing pages

**If zero files are found**: check whether the path exists, list 3–5 nearby directories that do contain doc files, and ask "Did you mean one of these?"

Count the pages found. Then:

- **≤ 50 pages**: proceed.
- **> 50 pages**: stop and tell the user:

  > "Found N pages — that's too many to audit reliably in a single Claude Code session. A large audit risks hitting context limits and producing an incomplete or noisy report.
  >
  > You have two options:
  >
  > **1. Get help from us** — book a session at [promptless.ai/meet](https://promptless.ai/meet) and we'll run a proper audit with you.
  >
  > **2. DIY by section** — re-run the audit with a subdirectory name as a hint (e.g. `/docs-audit getting-started`). The audit will catch bugs and silent failures within that section well, but cross-file checks — like detecting when critical information only lives on one page — won't catch issues that span sections."

Print a one-line count for valid scopes: `Found N pages to audit.` Do not list every file.

---

## Step 2: Cross-file scan (single agent, runs first)

Launch one agent to read all pages and produce a **global map**. This must complete before Step 3.

The global map captures only:

**A. Silent failure risks** — must pass ALL THREE tests:
1. Hard blocker or silent failure (a required permission, a non-obvious constraint, a step that breaks without it)
2. A user following a *different* page would plausibly hit this without warning
3. Genuinely surprising — not something a user would naturally anticipate

Flag sparingly. If in doubt, leave it out.

**B. Factual errors** — incorrect technical claims (wrong protocol names, wrong API behavior, wrong defaults)

**C. Broken references** — internal links or paths pointing to something that doesn't exist. Do NOT flag image src paths.

**D. Contradictions** — two pages that state opposite things about the same behavior

**E. Product-specific term variants** — same named feature/UI label/API concept written differently across pages, where swapping would cause a user to configure the product differently. Do NOT flag generic English synonyms.

**F. Stub pages** — pages that contain only frontmatter and no content

Output the global map as a structured artifact. Keep it concise.

---

## Step 3: Per-page triage (parallelized)

Launch subagents in parallel — one per batch of related pages. Each subagent receives the page content and the global map.

For each page, work through the checklist below. Flag only real issues — not style preferences.

---

### Step 3a: Infer doc type per page

Before checking, infer the page type from its content, title, or frontmatter:
- **Tutorial** — teaches by doing; walks a beginner through a complete task from start to finish
- **How-to guide** — goal-oriented steps for a specific task; assumes the reader knows the basics
- **Reference** — exhaustive structured information (API params, error codes, config options)
- **Explanation** — conceptual; explains why things work the way they do

Apply the full checklist below, but pay special attention to the doc-type-specific items.

---

### Checklist

**1. Self-containment**
*(High relevance for RAG — chunks are retrieved without surrounding context)*

- [ ] Does the page use "see above," "as described earlier," "same as before," or similar backward/forward references? Flag these — they cause hallucination when a chunk is retrieved without its context.
- [ ] Are prerequisites, required permissions, and constraints stated before the steps that need them — either inline or in a "Before you begin" block?
- [ ] Does any step say things like "click the button in the screenshot" or "as shown in the diagram above"? Agents cannot see images or diagrams — instructions that can only be followed with visual media are invisible to them.
- [ ] Do any expandable/collapsible sections likely load content dynamically via JavaScript? Static HTML that is visually hidden is fine; dynamic content is invisible to agents.

**2. Failure mode documentation**
*(High relevance for all agent pathways)*

- [ ] **Tutorials and how-to guides**: is there any troubleshooting or debugging section? Agents with structured failure information perform significantly better than agents guessing from general knowledge.
- [ ] Are error codes, error strings, and status codes quoted exactly as they appear in the product — not paraphrased? Agents search for exact strings.
- [ ] Are known edge cases, "won't fix" behaviors, or non-obvious constraints documented?

**3. Code examples**
*(Skip entirely if the product has no API or code surface)*

- [ ] Do critical steps have code examples? Removing examples collapses LLM pass rates far more than removing prose.
- [ ] Do examples have inline comments explaining their intent — correct example vs. near-miss vs. instruction step? Without comments, agents can misinterpret examples as tasks to execute.
- [ ] Are examples diverse enough to cover varied inputs — not only the happy path?
- [ ] Never invent examples. If one is missing and no source is available, flag as `[CODE-EXAMPLE — verify against source]`.

**4. Section length and structure**
*(High relevance for complex workflow pages)*

- [ ] **Tutorials and how-to guides**: is the page excessively long? Planning tasks degrade around 16k–33k tokens. Reference pages can be longer; complex workflow pages should not.
- [ ] Are constraints and defaults buried in prose rather than in tables, `must`/`should`/`must not` callouts, or structured lists? Prose is discarded first during LLM context compression.
- [ ] Are importance signals present — words like "key," "critical," "required," "optional," "forbidden" — for high-value constraints?

**5. Doc-type-specific checks**

*Tutorials only:*
- [ ] After each major step, is there a verification checkpoint ("you should now see…" or "run X to confirm")? Agents need state confirmation before proceeding to the next step.
- [ ] Does the tutorial stay on the happy path, or does it branch into a sprawling decision tree? Detours and corner cases should be in separate how-to pages.

*How-to guides only:*
- [ ] Is the goal clear from both the title AND the opening sentence? Agents arriving from search need to confirm immediately that this page matches their task.

*Reference pages only:*
- [ ] Are headings stable and terminology consistent within the page? Inconsistent headings force agents to guess whether two sections describe the same or different concepts.

*Explanation pages only:*
- [ ] Is any critical information explained ONLY on this explanation page? Explanation pages are the first to lose content during LLM context compression (prose is discarded before structured content). Critical facts here are high-risk single points of failure.
- [ ] Is there a concepts or definitions section that lists the key terms covered? This helps agents disambiguate product-specific terms when arriving without surrounding context.

**6. Page title clarity**
*(Web search pathway — agents decide which URL to fetch based on title alone)*

- [ ] Is the title specific enough for an agent scanning a list of search results to decide whether this page is worth fetching? "Overview" or "Introduction" alone is not enough.

**7. Cross-file issues** *(from global map)*

- [ ] Is any concept on this page a cross-page SPOF? Only flag if it passes all three tests from Step 2A.
- [ ] Does this page contradict another page on the same behavior?
- [ ] Are there inconsistent uses of product-specific named terms across pages?

---

### What to skip

- Style preferences of any kind
- Image src paths or alt text
- Natural English synonyms ("repo" vs "repository")
- Suggestions to add more examples when none are required
- Opinions on prose quality
- Stub pages (those are caught globally in Step 2F)

---

### Output format per page

Only output a section for pages with at least one issue. If clean, skip the page entirely.

```
## [page path]
Doc type: tutorial | how-to | reference | explanation

- [SELF-CONTAINED] description — exact location
- [MEDIA-ONLY] instruction can only be followed with an image/diagram — exact location
- [DYNAMIC-CONTENT] expandable section likely loads dynamically — exact location
- [FAILURE-DOCS] description — exact location
- [CODE-EXAMPLE — verify against source] description
- [SECTION-LENGTH] description
- [VERIFICATION-CHECKPOINT] tutorial is missing state confirmation after step N
- [CONCEPTS-SECTION] explanation page has no definitions/concepts section
- [EXPLANATION-SPOF] critical info lives only here and is at high risk of compression loss
- [TITLE] description
- [BUG] description — exact location
- [BROKEN-LINK] description
- [CONTRADICTION] this page says X; [other-page] says Y
- [SILENT-FAILURE] description
- [TERMINOLOGY] description — variants: ["x", "y"]
```

One line per issue. No sub-headings within a page entry. No "easy wins" section.

---

## Step 4: Compile the report

```
# Docs Audit Report
Generated: <date>  |  Pages scanned: N  |  Issues found: M

---

## Bugs and broken content
- [file] [BUG] description
- [file] [BROKEN-LINK] description

---

## Self-containment
- [file] [SELF-CONTAINED] description

---

## Failure mode documentation
- [file] [FAILURE-DOCS] description

---

## Code examples
(Omit section entirely if product has no code/API surface)
- [file] [CODE-EXAMPLE — verify against source] description

---

## Section length and structure
- [file] [SECTION-LENGTH] description

---

## Cross-file issues
Silent failures and contradictions that span pages.
- [file] [SILENT-FAILURE] description — concept: "name"
- [file] [CONTRADICTION] description

---

## Term inconsistencies
| Canonical term | Variants found | Pages |
|---|---|---|

---

## Stub pages to clean up
- [file] — reason

---

## Page titles
- [file] [TITLE] description

---

## What was NOT flagged
Brief note on what was consciously skipped.
```

Present the report and **stop**. Do not make any edits yet.

**Target length**: Readable in under 5 minutes. If you have more than 25 issues total, re-apply the "skip" rules — you are probably including style preferences.

---

## Step 5: Get approval

Ask:

> "Which fixes would you like me to apply?
> - **'apply bugs'** — factual errors and broken links
> - **'apply self-containment'** — fix backward references, add missing prerequisites
> - **'apply failure-docs'** — add troubleshooting sections and exact error strings
> - **'apply structure'** — add importance signals, convert prose constraints to tables
> - **'apply [page path]'** — fix everything on one page
> - **'apply all'** — apply all findings
>
> I'll skip contradictions and stubs unless you tell me the canonical answer."

Wait for response before proceeding.

---

## Step 6: Apply approved edits

For each approved fix:

1. Read the current file before editing
2. Make the minimal change — do not rewrite surrounding content
3. For contradictions: ask which page is correct before editing either
4. For stub pages: ask whether to delete or redirect — do not edit unilaterally
5. For `[CODE-EXAMPLE — verify against source]`: if the user provides a repo path, read the source first; otherwise leave a comment `<!-- TODO: add code example, verify against source -->`

After applying, output a one-paragraph summary of what changed and what was skipped.

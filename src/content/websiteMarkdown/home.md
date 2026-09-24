---
title: Continuously improve your AI workforce and docs
description: Promptless keeps customer-facing documentation and agent instructions current. Promptless for Docs suggests doc updates when your product changes; Promptless for Agent Instructions governs the skills, rules, hooks, and MCP configuration your agents use and improves them from real sessions.
routePath: /
---
Promptless automatically updates your customer docs, screenshots, release notes, developer docs, support articles, knowledge base, API docs, changelogs, tutorials, code examples, and how-to guides.

AI agents eliminate docs drift and automate the most painful parts of docs maintenance.

- Book a demo
- Backed by Y Combinator
- Trusted by fast-growing startups and Fortune 500 enterprises alike
- Play the Promptless demo preview

## Testimonials

### Mo King, Senior Technical Writer at Runpod

"Promptless dramatically speeds up my time-to-first-draft. My team literally calls me a 10x tech writer."

### Alan Mond, Docs Maintainer at Bazel

"This is the most 'make something people want' feature I have ever seen. It solves my problem in a better way than I thought would be possible."

### Aaron Levin, Founding Solutions Engineer at Vellum

"Promptless updates every relevant section of our docs, catching both the latest changes and old spots we'd missed. It feels like magic."

### Eduardo Soubihe, CTO at Latitude.sh

"I love your product. It works incredibly well and basically pays for itself right away."

### Nicholas DeWald, Head of Developer Docs at Prove

"Promptless is a solo tech writer's godsend."

## How Promptless works

### 1. Listen

When a PR opens, a Slack thread about docs starts, or a DOC ticket gets created, Promptless automatically wakes up and decides whether it warrants a doc update.

### 2. Draft

Promptless does research across the context you connect it to, and proactively notifies you when there's a documentation suggestion.

### 3. Review

Review citations, provide feedback, or edit suggestions inline.

### 4. Publish

Open PRs or deploy directly to your docs provider.

## Why Promptless?

### Proactive, Automatic Updates

PRs, Slack threads, and support tickets kick off doc updates automatically. No prompting required.

### Screenshot Capture

Auto-regenerates screenshots when the UI changes, complete with crops and annotations.

### Writes Like Your Team

Matches the style of your existing docs, or plugs in your style guide and Vale rules. No AI slop.

### Full Citations and Explanations

Every suggestion has in-line citations to code functions, Slack conversations, websites, or support tickets.

### Learns From Your Feedback

Every time you leave a comment, reject a suggestion, or message Promptless with feedback, Promptless gets better.

### Works With Your Stack

Plugs into your existing docs platform, repos, and tools. Promptless adapts to your workflows, not vice versa.

## Promptless for Agent Instructions

Agent instructions that improve with every session. One reviewed Instruction Hub for the skills, hooks, subagents, and tool config your agents share across Claude, Codex, Cursor, and Gemini. Real sessions show which instructions fail; Promptless opens the pull request that fixes them. Raw traces never leave your infrastructure.

- Install the toolchain: `python -m pip install "git+https://github.com/Promptless/pig-toolchain.git@main"`
- Public toolchain: https://github.com/Promptless/pig-toolchain
- Documentation: /docs/governance
- Launch post: /blog/product-updates/introducing-promptless-for-agent-instructions

### How it works

Four layers, one loop. Layer 1, the Instruction Hub, is a Git repository of skills, rules, subagents, commands, hooks, and MCP configuration that the `pig` toolchain compiles into plugins for Claude, Codex, Cursor, and Gemini. Layer 2, traces: enrolled Claude Code, Claude Desktop, and Codex hosts upload native session logs to a trace analyzer running in your Kubernetes cluster, with your PostgreSQL and your object storage. Layer 3, findings: the analyzer turns repeated failures into findings with severity, confidence, cited sessions, and the exact commit it read. Layer 4, remediation: a finding with enough evidence becomes a focused pull request against your hub, gated by your CODEOWNERS, required reviews, and branch protection. Layers 2 through 4 are optional; a hub publishes without an analyzer.

### Set up in three steps

1. Author: `pig init` scaffolds `hub.yaml`, the required `pig` plugin, and the asset directories; add a `SKILL.md`, group assets into plugins, then run `pig validate` and `pig verify`.
2. Publish: two reusable GitHub Actions or GitLab CI workflows check pull requests and publish merges to a release branch; teammates install the plugins they need.
3. Learn: deploy the analyzer in your cluster, set `trace_ingestion.enabled: true`, and approve each host in the browser. Findings arrive as GitHub issues; fixes arrive as pull requests.

### What stays in your cluster

Raw and canonical traces live in your bucket and your PostgreSQL. Your configured model provider (OpenAI, Azure OpenAI, or AWS Bedrock) receives session-derived analysis input. Promptless receives trace identifiers, host attribution, timestamps, status, and event and turn counts, plus findings and evidence summaries, which can describe session details. Prompts, tool output, working directories, and Git metadata are never sent to Promptless.

### Measured on our own agents

After 30 days of governance on Promptless's own engineering, GTM, and ops agents (not customer results): token spend down 18%, first-attempt completion up 15%, wall-clock time per session down 32%, human interruptions down 42%. Findings from those sessions produced a re-login hook for expired auth tokens, an AGENTS.md update plus an incident-investigation subagent for ignored observability tools, a guard in the customize-sales-deck skill, and a shared skill built from one engineer's local development setup.

### Frequently asked questions

- Does it work with our agents? The toolchain builds plugins for Claude, Codex, Cursor, and Gemini. Native trace collection covers Claude Code, Claude Desktop, and Codex.
- Does Promptless change our instructions automatically? No. A supported finding becomes a pull request against your hub; your review rules decide whether it merges.
- Can we start without deploying the analyzer? Yes. Publishing and installing plugins needs a Git repository, the pig toolchain, and CI; trace ingestion is off by default.
- Do we have to move every AGENTS.md into the hub? No. Move reusable procedures into shared skills and keep repository-specific context beside the project it describes.
- Which model runs the analysis? The provider you configure, from your cluster, with your credentials or cloud identity.

Get a demo: /meet?content=agent-instructions#book

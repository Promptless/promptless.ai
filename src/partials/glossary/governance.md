---
type: term-set
language: en
---

agent session
agent sessions
:   A period of work that an AI agent such as Claude Code, Codex, or Cursor records in its native logs. PIG collects sessions from enrolled hosts and cloud executions as traces for analysis.

analyzer worker
trace analyzer
:   The PIG service, also called the trace analyzer, that your team deploys in its own Kubernetes cluster. It receives traces from enrolled hosts, stores them, analyzes sessions, and sends findings to Promptless.

cloud integration grant
:   An authorization that an organization admin creates so Claude Code or Codex executions in cloud sandboxes, such as Claude Tag, enroll themselves. Each execution then uploads its native traces to your trace analyzer.

finding
findings
:   An instruction problem that the trace analyzer observes in agent sessions, such as a missing, stale, conflicting, or ineffective instruction. Each finding records severity, confidence, and supporting evidence, and can lead to a remediation pull request.

host enrollment
:   The step that connects a person's Claude Code, Codex, or Cursor installation to your trace analyzer so PIG collects its sessions. A signed-in organization member approves each host in the browser.

Instruction Governance
Promptless Instruction Governance
:   The Promptless product for maintaining the instructions AI agents use. Teams publish shared instructions from an Instruction Hub, learn how they perform in real sessions, and review evidence-backed improvements.

Instruction Hub
Instruction Hubs
:   A Git repository that holds the shared instructions your team maintains for AI agents, including assets, plugin definitions, and hub configuration. The pig toolchain compiles it into plugin releases that agents install.

marketplace
:   The catalog through which Claude Code, Codex, and Cursor discover and install an Instruction Hub's released plugins. Its identity belongs to the hub and is separate from individual plugin IDs.

model provider
model providers
:   The service that hosts the language models Promptless uses. Promptless for Docs uses AWS Bedrock by default, and the PIG trace analyzer calls OpenAI, Azure OpenAI, or Bedrock in your provider account.

pig CLI
:   The pig command-line tool that scaffolds, scans, validates, and compiles an Instruction Hub. Authors run it locally, and CI runs it when checking and publishing hub changes.

plugin
plugins
:   A named group of Instruction Hub assets, such as skills and rules, that users install in their agents. The pig toolchain compiles each plugin into a format for each target agent.

remediation
:   The work to address a finding. When the Instruction Hub owns the cause, a remediation agent can prepare a pull request against the hub for your team to review.

self-hosting
:   Running Promptless components on infrastructure your organization controls. Promptless for Docs offers self-hosted deployments to Enterprise customers, and the PIG trace analyzer runs in your own Kubernetes cluster.

skill
skills
Agent Skills
:   A reusable procedure for an AI agent, packaged as a directory with instructions and a description of when to use it. Promptless runs matching skills from your docs repository, and Instruction Hubs distribute shared skills in plugins.

supported agents
:   The AI agents that PIG distributes instructions to or collects native traces from. They are Claude Code, Codex, Cursor, Gemini CLI, and Claude Desktop, and support for each capability differs by agent.

trace
traces
:   PIG's record of one agent session, reconstructed from the agent's native logs. It holds records such as messages, tool activity, and timestamps, which the trace analyzer examines for instruction problems.

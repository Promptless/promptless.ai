---
type: term-set
language: en
---

agent session
agent sessions
:   A period of work that an AI agent records in its native logs. PIG collects sessions from enrolled hosts and cloud executions as traces for analysis.

analyzer release
analyzer releases
:   A version of the deployed trace analyzer. By default, the trace analyzer updates to each stable release, and you can pause updates or pin a release.

analyzer worker
trace analyzer
:   The PIG service, also called the trace analyzer, that your team deploys in its own infrastructure. It receives traces from enrolled hosts, stores them, analyzes sessions, and sends findings to Promptless.

asset
assets
:   One unit of source content or configuration in an Instruction Hub, stored under assets/. Kinds include skills, rules, agents, commands, hooks, and MCP server configurations, and a plugin refers to each asset by its kind and ID.

canonical trace
canonical traces
:   A trace's records organized into a common representation for analysis, whichever agent produced them. The trace analyzer keeps canonical trace objects in object storage.

cloud integration grant
:   An authorization that an organization admin creates so agent executions in cloud sandboxes enroll themselves. Each execution then uploads its native traces to your trace analyzer.

evidence occurrence
evidence occurrences
:   The connection between a finding and one session where it appeared, including what happened in that session.

finding
findings
:   An instruction problem that the trace analyzer observes in agent sessions, such as a missing, stale, conflicting, or ineffective instruction. Each finding records severity, confidence, and supporting evidence, and can lead to a remediation pull request.

Friction Analyzer
:   The analysis component inside the trace analyzer. It examines completed or quiet sessions with the configured model provider and Instruction Hub context, and records the instruction problems it observes as findings.

GitOps
:   Managing deployment configuration through a Git repository that a controller applies to your infrastructure. For PIG, GitOps can own your desired deployment configuration and secret delivery, while PIG owns its application releases after the one-time bootstrap.

host enrollment
:   The step that connects a person's AI agent installation to your trace analyzer so PIG collects its sessions. A signed-in organization member approves each host in the browser.

host runtime
:   The collector that the pig plugin includes when trace ingestion is on. It runs on each host and uploads the agent's sessions to your trace analyzer without blocking the agent.

host
hosts
:   An enrolled agent environment on a workstation or other machine. Its identity lets PIG attribute traces and collection status to the right source.

hub release
hub releases
:   The versioned result of compiling an Instruction Hub's selected plugins for its selected targets. Hub releases and analyzer releases update independently.

Instruction Governance
Promptless Instruction Governance
:   The Promptless product for maintaining the instructions AI agents use. Teams publish shared instructions from an Instruction Hub, learn how they perform in real sessions, and review evidence-backed improvements.

Instruction Hub
Instruction Hubs
:   A Git repository that holds the shared instructions your team maintains for AI agents, including assets, plugin definitions, and hub configuration. The pig toolchain compiles it into plugin releases that agents install.

marketplace
:   The catalog through which supported agents discover and install an Instruction Hub's released plugins. Its identity belongs to the hub and is separate from individual plugin IDs.

model provider
model providers
:   The service that hosts the language models Promptless uses. Promptless for Docs has a default provider, and the PIG trace analyzer calls the provider you configure in your own account.

object storage
:   Private cloud storage where the PIG trace analyzer keeps raw uploads and canonical trace objects. Each deployment uses one storage location from a supported cloud provider.

pig CLI
:   The pig command-line tool that scaffolds, scans, validates, and compiles an Instruction Hub. Authors run it locally, and CI runs it when checking and publishing hub changes.

plugin
plugins
:   A named group of Instruction Hub assets, such as skills and rules, that users install in their agents. The pig toolchain compiles each plugin into a format for each target agent.

remediation
:   The work to address a finding. When the Instruction Hub owns the cause, a remediation agent can prepare a pull request against the hub for your team to review.

self-hosting
:   Running Promptless components on infrastructure your organization controls. Promptless for Docs offers self-hosted deployments to Enterprise customers, and the PIG trace analyzer runs in your own infrastructure.

skill
skills
Agent Skills
:   A reusable procedure for an AI agent, packaged as a directory with instructions and a description of when to use it. Promptless runs matching skills from your docs repository, and Instruction Hubs distribute shared skills in plugins.

supervisor
:   The trace analyzer's update controller, installed by a one-time bootstrap. It updates the analyzer to new releases and resets the resources it generates to their configured values.

supported agents
:   The AI agents that PIG builds plugins for or collects native traces from. Support for each capability differs by agent.

target
targets
:   An agent format that the pig toolchain builds an Instruction Hub's plugins for. Each target gets its own compiled output.

trace
traces
:   PIG's record of one agent session, reconstructed from the agent's native logs. It holds records such as messages, tool activity, and timestamps, which the trace analyzer examines for instruction problems.

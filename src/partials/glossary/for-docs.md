---
type: term-set
language: en
---

agent-ready docs
:   Documentation that AI agents can read, search, and cite on their own. Every Starport site ships llms.txt files, a read-only docs MCP server, page actions, and agent-readiness scoring.

assignment and routing
:   How Promptless gets each suggestion and its docs PR to the right people. By default it notifies the requester and assigns them the docs PR, and you change these defaults in your Knowledge Base.

brand assets
:   The official Promptless logos, brand colors, and product screenshots for press, partner, and integration use. The media kit publishes them with usage guidelines, such as using the logo unmodified.

changelog
changelogs
:   A file or page that records a product's changes. When a change ships, Promptless drafts changelog entries as suggestions that follow your existing format and the conventions you teach it.

context source
context sources
:   A read-only integration, such as Jira, Linear, Confluence, or Notion, that gives Promptless the product knowledge behind a change. Promptless reads it while drafting a suggestion, and the connection is one-way.

custom task
custom tasks
:   A workflow you teach Promptless by pairing a trigger, which sets when the task runs, with written instructions for what Promptless does. Examples include reviewing contributor PRs in your docs repository and turning weekly analytics into doc-gap suggestions.

Deep Analysis
:   A New Task mode for large documentation projects, such as audits, section rewrites, and multi-page work. Promptless plans the work, splits it into parts, and returns a coordinated set of suggestions, often over several hours.

doc collection
doc collections
:   A documentation repository, such as a GitHub repository or GitLab project, where Promptless publishes updates. An organization can have one doc collection per repository, each with its own settings such as the default branch and path scope.

Doc Detective
:   An open-source documentation testing framework that runs the procedures in your docs as tests. When you enable it on a doc collection, Promptless creates and updates tests as your product changes.

docs-as-code
docs as code
:   An approach that keeps documentation as source files in a Git repository, changed through pull requests and published by a build tool. Promptless proposes changes to that content as a branch and a pull request.

docs debt
:   The backlog of stale steps, off-style prose, duplicate pages, and outdated structure that builds up in a large docs set. Promptless treats it as documentation work, using Deep Analysis to audit, rewrite, and restructure pages.

docs migration
:   A one-time project that moves documentation off a hosted platform and onto a Git-backed docs-as-code platform, with redirects from old URLs. Promptless runs the migration for you when you move to Starport.

docs PR
docs PRs
documentation PR
docs pull request
:   The GitHub pull request or GitLab merge request that Promptless opens in your documentation repository for a suggestion. You review it and steer it with comments, the same way you review code.

feedback
:   Change requests, comments, and close reasons you give Promptless on a suggestion. Feedback on one suggestion changes only that suggestion, unless you phrase it as a standing rule for future suggestions.

GitHub App
:   The app you install on a GitHub organization to connect its repositories to Promptless. It has read and write access to the repositories you select, for triggers, context, and opening docs PRs.

Knowledge Base
Agent Knowledge Base
:   The files Promptless reads to learn your documentation style, product context, and workflow preferences, such as PROMPTLESS.md and your style guide. Promptless updates them from your feedback, and organization admins can edit them.

llms.txt
:   The entry-point file of the llms.txt standard, which names a docs site and links AI agents to plain-text versions of its docs. Starport generates it at build, along with llms-full.txt and llms-small.txt.

localization
:   Publishing docs in more than one language and keeping the translations current. When source-language pages change, Promptless drafts the matching translated updates for a fluent reviewer to check before they ship.

MCP server
:   A Model Context Protocol server that editors and chat apps connect to, such as the Promptless MCP server for starting and managing documentation tasks. Each Starport site also serves a read-only MCP server for searching its docs.

multi-repo routing
:   Configuring Promptless across many code and docs repositories so each change reaches the right docs. You scope triggers to the code that matters, scope each doc collection to its files, and add team preferences to the Knowledge Base.

noise filtering
relevance filtering
:   Tuning Promptless so it creates fewer low-value suggestions. You scope triggers to documentation-worthy events, rely on built-in filters, and use feedback to teach Promptless which changes to skip.

Open Source Program
open-source program
:   The Promptless program that makes Promptless free for CNCF, Linux Foundation, and other eligible non-commercial open-source projects. Projects join by contacting the Promptless team.

pilot
pilots
:   A 14-day trial of Promptless for growth and enterprise customers, run on your own documentation, workflows, and trigger events. It starts when Promptless creates your first suggestion, and you judge it against success criteria you agree on.

promptless.yaml
:   The configuration file in your Knowledge Base that defines your doc collections, triggers, context sources, and publishing policies. You edit it on the Configuration page, in Form or YAML mode.

redirects
redirect
:   Rules that send readers and search engines from an old page URL to its new page after a migration or restructure. Your documentation platform and host serve them, so existing links keep working.

referral program
:   A Promptless program that rewards people at Promptless customers for introducing new docs teams. A reward is paid once the introduced team becomes a paying customer.

release notes
:   Published notes that describe what changed in a product release. Promptless keeps them current with your other docs, and a schedule trigger can check each week that they reflect what shipped.

release timing
:   Aligning when Promptless drafts and publishes suggestions with your release cycle. The trigger event sets when Promptless drafts, and the publishing policy sets whether a suggestion waits for review or merges on its own.

review queue
suggestions list
:   The suggestions list in the Promptless dashboard, where your team triages suggestions. It puts the most urgent work first, and you claim, assign, filter, and search suggestions there.

schedule
schedule trigger
schedule triggers
:   A trigger that runs standing instructions you write on a repeating cron schedule, with no triggering event. Use it for recurring work, such as a weekly check that your release notes reflect what shipped.

screenshots
screenshot
:   Images of your product's interface in your docs. Promptless Capture keeps them in sync with your interface, capturing new ones from a test account when a change affects a documented screen.

Starport
:   A managed docs-as-code framework from Promptless, built on Astro Starlight. Promptless sets up your docs site and its build and deploy pipeline, and keeps the content current in a Git repository you own.

style guide
:   Your team's written documentation style rules. Promptless reads the style guide in your Knowledge Base before it writes, and adds preferences it learns from feedback.

suggestion
suggestions
:   A proposed documentation change that Promptless drafts when a trigger shows your docs need an update. You review it in the dashboard with its citations, then publish it as a docs PR or close it.

teaching conventions
:   Giving Promptless a rule your team wants in every suggestion, such as a tone or a change type you never document. State it as a standing rule in feedback, or write it in the Knowledge Base yourself.

trigger
triggers
:   An event that starts Promptless documentation work, such as a pull request opening, a Slack message, or an API call. Promptless reads it, decides whether your docs need an update, and creates a suggestion when they do.

Vale
:   An open-source prose linter that enforces style rules. When a doc collection has a Vale configuration, Promptless lints the prose it writes and fixes findings before suggestions reach your review queue.

versioned docs
:   Documentation that keeps more than one live product version, with each version on its own branch or in its own directory. Promptless models versions as the branches or directories your docs already use.

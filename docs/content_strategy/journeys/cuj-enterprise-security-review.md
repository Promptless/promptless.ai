---
id: cuj-enterprise-security-review
type: cuj
title: Pass security, self-host, and SSO review
personas: [persona-enterprise-docs-lead, persona-scaleup-solo-writer]
trigger: "IT/security/procurement must approve Promptless before a pilot can proceed."
entry_point: /docs/security-and-privacy/compliance-and-certifications
success_criteria: "Security/IT signs off — the champion can forward complete, standalone docs on data handling, deployment, SSO, and subprocessors, and self-hosting is available where required."
steps:
  - { stage: "Compliance & certifications", doc: /docs/security-and-privacy/compliance-and-certifications, exists: true }
  - { stage: "Data handling & classification", doc: /docs/security-and-privacy/data-handling-and-classification, exists: true }
  - { stage: "Network architecture", doc: /docs/security-and-privacy/network-architecture, exists: true }
  - { stage: "Subprocessors & privacy", doc: /docs/security-and-privacy/promptless-subprocessors, exists: true }
  - { stage: "Single sign-on setup", doc: /docs/security-and-privacy/single-sign-on-sso-setup, exists: true }
  - { stage: "Self-hosting / on-prem deployment", doc: /docs/self-hosting, exists: true }
  - { stage: "Repo access scope for security review", doc: "/docs/security-and-privacy/access-and-permissions", exists: false, note: "[GAP] read-only / least-privilege access posture not consolidated" }
---

# CUJ: Pass security, self-host, and SSO review

**Scope:** The parallel gating journey for enterprise (and security-sensitive scale-up)
accounts. Runs alongside the pilot, not after it.

**Trigger.** Before any pilot, IT/security/procurement must approve — a formal gauntlet for
enterprise customers. The most common pilot blocker named after access itself (one prospect
reportedly declined over integration discomfort; another's pilot waited on security sign-off).

**Narrative.** The champion becomes an internal advocate who must **forward standalone
documentation** to reviewers: data handling, network architecture, subprocessors, compliance
certs, SSO, and—often decisively—**self-hosting/on-prem**. The corpus shows these docs are
read by non-docs stakeholders and must stand on their own.

**Current coverage / gap.** This is the **best-covered journey today** (security-and-privacy/*,
self-hosting, SSO all exist). The one gap: a consolidated **repo access / least-privilege
(read-only) posture** page that ties the access-scope decision from
[cuj-connect-sources](cuj-connect-sources.md) to the security narrative.

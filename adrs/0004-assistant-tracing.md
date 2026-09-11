# Capture Ask AI conversations in PostHog

- Status: accepted
- Date: 2026-09-11
- Deciders: Prithvi

## Context and Problem Statement

The team needs to review complete Ask AI answers and understand which sources
informed them. Question, timing and feedback events alone do not provide that evidence.

## Decision Drivers

- Connect each answer to its question, sources, feedback and browser identity.
- Reuse the existing PostHog project and Starport assistant.
- Keep production and preview traces distinguishable.

## Considered Options

- Add answer text to browser analytics events.
- Use PostHog's AI SDK v7 OpenTelemetry integration on the server.
- Operate a separate conversation database.

## Decision Outcome

Opt into full capture with the site-owned `src/lib/assistant-telemetry.ts` module.
Use the official PostHog trace exporter and AI SDK OpenTelemetry integration.
Capture prompts, history, search/read tool inputs and outputs, generated text,
usage and outcomes. Each answer attempt gets its own root trace; follow-ups and
retries share an AI session ID. Attach the browser's PostHog distinct ID and
replay session ID when its SDK is ready and capture is allowed.

Initialize the exporter once per process. Register request completion with
Vercel `waitUntil`, close all spans after streaming settles, and flush the
processor, including exports already started by its timer. Preserve partial text on cancellation. Include environment,
deployment, Git revision and corpus build timestamp as available.

### Consequences

- Full user questions and model output are stored in the existing PostHog project.
- Opted-out visitors and requests without browser analytics context produce no traces.
- Thumbs events link to the exact trace through `$ai_trace_id`; they are custom
  events, not PostHog Survey responses in the native Feedback tab.
- Node 22.22 or newer is required. Preview and production need the existing
  PostHog project token/host and the assistant's Anthropic key.

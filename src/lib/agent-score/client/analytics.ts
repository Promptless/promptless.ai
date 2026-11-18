/**
 * Guarded PostHog capture. The PostHog snippet defines window.posthog before
 * init, so `capture` is missing wherever PostHog is not configured; analytics
 * must never break the tool. Events are documented in docs/events.md.
 */
type Properties = Record<string, unknown>;

declare global {
  interface Window {
    posthog?: { capture?: (event: string, properties?: Properties) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

export function capture(event: string, properties: Properties): void {
  try {
    if (typeof window.posthog?.capture === 'function') window.posthog.capture(event, properties);
  } catch {
    // Analytics failures are never user-facing.
  }
}

/** Mirror of the click tracker's GA event, for actions that are not links. */
export function gaCtaClick(action: string, location: string, linkUrl: string): void {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cta_click', { funnel_stage: 'evaluation', action, location, campaign: '', link_url: linkUrl });
    }
  } catch {
    // Ignore.
  }
}

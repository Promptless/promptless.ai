type EventName = 'search_query' | 'search_result_click' | 'search_error' | 'assistant_question' |
  'assistant_source_click' | 'assistant_latency' | 'assistant_error' | 'assistant_feedback';

/** Site-owned adapters consume this event; no analytics service is built into the plugin. */
export function track(name: EventName, properties: Record<string, string | number | boolean>) {
  window.dispatchEvent(new CustomEvent('starport:analytics', { detail: { name, properties: { ...properties, page_url: location.pathname } } }));
}
import type { AnalyticsContext } from '../server/telemetry';

/** Request the site's current analytics context; the site controls capture policy. */
export function assistantAnalyticsContext(): AnalyticsContext | undefined {
  const detail: { context?: AnalyticsContext } = {};
  window.dispatchEvent(new CustomEvent('starport:assistant-context', { detail }));
  return detail.context;
}

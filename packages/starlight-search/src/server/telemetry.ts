import type { TelemetryOptions } from 'ai';
import type { HistoryMessage } from '../core/conversation';

/** Browser analytics context is attribution metadata, never authentication. */
export interface AnalyticsContext {
  distinctId: string;
  sessionId?: string;
}

export interface TraceContext {
  conversationId: string;
  attemptId: string;
  analytics?: AnalyticsContext;
  messages: HistoryMessage[];
  pageId: string;
  locale: string;
  contentVersion: string;
}

export interface TraceOutcome {
  status: 'finished' | 'error' | 'aborted';
  text: string;
  finishReason?: string;
}

/** A site owns its exporter, capture policy, and hosting lifecycle. */
export interface AssistantTrace {
  /** Printable ASCII, 1–256 characters. Invalid IDs are omitted from client metadata. */
  traceId: string;
  telemetry: TelemetryOptions;
  run<T>(generate: () => T): T;
  finish(outcome: TraceOutcome): Promise<void>;
  waitUntil(completion: Promise<void>): void;
}

export type StartAssistantTrace = (context: TraceContext) => AssistantTrace | undefined;

import { randomUUID } from 'node:crypto';
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { answerQuestion } from './assistant';
import type { AssistantTrace, StartAssistantTrace, TraceContext, TraceOutcome } from './telemetry';

/** Drain the bounded answer stream so SDK spans close on errors and cancellation. */
export function answerResponse(options: Parameters<typeof answerQuestion>[0], context: Omit<TraceContext, 'contentVersion'>, startTrace?: StartAssistantTrace): Response {
  let trace: AssistantTrace | undefined;
  try { trace = startTrace?.({ ...context, contentVersion: options.corpus.contentVersion }); }
  catch { console.error('[starport-search] Could not initialize assistant telemetry'); }
  const traceId = trace && /^[\x21-\x7e]{1,256}$/.test(trace.traceId) ? trace.traceId : undefined;
  if (trace && !traceId) console.error('[starport-search] Invalid assistant trace ID');
  const abort = new AbortController();
  const signal = AbortSignal.any([options.signal, abort.signal]);
  const generate = () => answerQuestion({ ...options, signal, telemetry: trace?.telemetry });
  let cancelled = false;
  let complete!: () => void;
  const completed = new Promise<void>((resolve) => { complete = resolve; });
  const outcome: TraceOutcome = { status: 'error', text: '' };
  let failed = false;
  const finish = async () => {
    try { await trace?.finish(outcome); }
    catch { console.error('[starport-search] Could not export assistant telemetry'); }
    finally { complete(); }
  };
  // Register while the request context is active, before the HTTP response returns.
  try { trace?.waitUntil(completed); }
  catch { console.error('[starport-search] Could not retain assistant telemetry work'); }
  try {
    const result = trace ? trace.run(generate) : generate();
    const reader = result.stream.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value.type === 'text-delta') outcome.text += value.text;
            if (value.type === 'finish') { outcome.status = failed || value.finishReason === 'error' ? 'error' : 'finished'; outcome.finishReason = value.finishReason; }
            if (value.type === 'error') { failed = true; outcome.status = 'error'; }
            if (value.type === 'abort') outcome.status = 'aborted';
            if (!cancelled) controller.enqueue(value);
          }
          if (!cancelled) controller.close();
        } catch (error) {
          outcome.status = signal.aborted ? 'aborted' : 'error';
          if (!cancelled) controller.error(error);
        } finally {
          reader.releaseLock();
          if (signal.aborted) outcome.status = 'aborted';
          await finish();
        }
      },
      cancel() { cancelled = true; abort.abort(); },
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream, generateMessageId: randomUUID,
        messageMetadata: ({ part }) => part.type === 'start' ? { conversationId: context.conversationId, attemptId: context.attemptId, ...(traceId && { traceId }) } : undefined,
        onError: () => 'The assistant could not finish. Please retry.',
      }),
      headers: { 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', ...(traceId && { 'X-Starport-Trace-Id': traceId }) },
    });
  } catch (error) {
    void finish();
    throw error;
  }
}

import { BatchSpanProcessor, type SpanExporter } from '@opentelemetry/sdk-trace-base';

/** Include timer-triggered exports when retaining a serverless request for flushing. */
export function createTraceProcessor(exporter: SpanExporter, scheduledDelayMillis = 5000) {
  const pending = new Set<Promise<void>>();
  const observed: SpanExporter = {
    export(spans, callback) {
      let finish!: () => void;
      const completion = new Promise<void>((resolve) => { finish = resolve; });
      pending.add(completion);
      const complete: typeof callback = (result) => {
        if (result.code !== 0) console.error('[assistant-telemetry] Trace export failed', {
          code: result.code, trace_ids: [...new Set(spans.map((span) => span.spanContext().traceId))],
        });
        try { callback(result); }
        finally { pending.delete(completion); finish(); }
      };
      try { exporter.export(spans, complete); }
      catch { complete({ code: 1, error: new Error('Trace exporter failed') }); }
    },
    shutdown: () => exporter.shutdown(),
  };
  const processor = new BatchSpanProcessor(observed, { scheduledDelayMillis });
  return {
    processor,
    async flush() {
      // BatchSpanProcessor.forceFlush omits exports already started by its timer.
      try { await processor.forceFlush(); }
      finally { await Promise.all([...pending]); }
    },
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BasicTracerProvider, type SpanExporter } from '@opentelemetry/sdk-trace-base';
import { createTraceProcessor } from '../src/lib/trace-processor';

test('flush retains timer exports already in flight, including failed exports', { timeout: 3000 }, async () => {
  let firstStarted!: () => void;
  const started = new Promise<void>((resolve) => { firstStarted = resolve; });
  let finishFirst!: Parameters<SpanExporter['export']>[1];
  let calls = 0;
  const exporter: SpanExporter = {
    export(_spans, callback) { if (++calls === 1) { finishFirst = callback; firstStarted(); } else callback({ code: 0 }); },
    shutdown: async () => {},
  };
  const { processor, flush } = createTraceProcessor(exporter, 1);
  const provider = new BasicTracerProvider({ spanProcessors: [processor] });
  const tracer = provider.getTracer('test');
  tracer.startSpan('first').end(); await started;
  tracer.startSpan('second').end();
  let finished = false;
  const flushing = flush().then(() => { finished = true; });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(calls, 2); assert.equal(finished, false);
  finishFirst({ code: 1, error: new Error('Test failure') });
  await flushing; assert.equal(finished, true);
  await provider.shutdown();
});

test('a rejected queue flush still waits for earlier in-flight work', { timeout: 3000 }, async () => {
  let firstStarted!: () => void;
  const started = new Promise<void>((resolve) => { firstStarted = resolve; });
  let finishFirst!: Parameters<SpanExporter['export']>[1];
  let calls = 0;
  const exporter: SpanExporter = {
    export(_spans, callback) { if (++calls === 1) { finishFirst = callback; firstStarted(); } else callback({ code: 1, error: new Error('Test failure') }); },
    shutdown: async () => {},
  };
  const { processor, flush } = createTraceProcessor(exporter, 1);
  const provider = new BasicTracerProvider({ spanProcessors: [processor] });
  const tracer = provider.getTracer('test');
  tracer.startSpan('first').end(); await started; tracer.startSpan('second').end();
  let settled = false;
  const flushing = flush().then(() => { assert.fail('Expected failure'); }, () => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 10)); assert.equal(settled, false);
  finishFirst({ code: 0 }); await flushing; assert.equal(settled, true);
  await provider.shutdown();
});

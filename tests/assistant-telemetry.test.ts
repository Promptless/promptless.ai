import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace } from '@opentelemetry/api';
import { registerTelemetry, simulateReadableStream } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';
import { MockLanguageModelV4 } from 'ai/test';
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider';
import { createAssistantTracing } from '../src/lib/assistant-telemetry';
import { answerResponse } from '../packages/starlight-search/src/server/response';

const exporter = new InMemorySpanExporter();
const processor = new SimpleSpanProcessor(exporter);
const startedSpans = new Map<string, Set<string>>();
const spanNames = new Map<string, string>();
const sdk = new NodeSDK({ spanProcessors: [{
  onStart(span, parent) {
    const { traceId, spanId } = span.spanContext();
    if (!startedSpans.has(traceId)) startedSpans.set(traceId, new Set());
    startedSpans.get(traceId)!.add(spanId); processor.onStart(span, parent);
    spanNames.set(spanId, span.name);
  },
  onEnd: (span) => processor.onEnd(span), forceFlush: () => processor.forceFlush(), shutdown: () => processor.shutdown(),
}], autoDetectResources: false });
sdk.start();
after(async () => { await sdk.shutdown(); });
const completions: Promise<void>[] = [];
const flushed: number[] = [];
const startTrace = createAssistantTracing({
  tracer: trace.getTracer('assistant-test'), properties: { environment: 'test', release: 'commit-1' },
  waitUntil: (work) => { completions.push(work); },
  flush: async () => { await processor.forceFlush(); flushed.push(exporter.getFinishedSpans().length); },
});
const corpus = { contentVersion: 'corpus-1', search: () => [], pageId: (path: string) => path,
  readPage: (pageId: string) => ({ pageId, url: pageId, title: 'Setup', locale: 'en', sections: [{ id: 'setup', heading: 'Setup', markdown: 'Run npm install.' }] }),
};
const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 20, text: 20, reasoning: 0 } };
const finish = (reason: 'stop' | 'tool-calls'): LanguageModelV4StreamPart => ({ type: 'finish', usage, finishReason: { unified: reason, raw: reason } });
const answer = () => new MockLanguageModelV4({ doStream: [
  { stream: simulateReadableStream({ chunks: [{ type: 'tool-call', toolCallId: 'read-1', toolName: 'readPage', input: '{"pageId":"/docs/"}' }, finish('tool-calls')] }) },
  { stream: simulateReadableStream({ chunks: [{ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Run npm install. [Setup](/docs/)' }, { type: 'text-end', id: 't' }, finish('stop')] }) },
] });
const request = () => ({ conversationId: crypto.randomUUID(), attemptId: crypto.randomUUID(), analytics: { distinctId: 'anonymous-visitor', sessionId: 'replay-1' },
  messages: [{ role: 'user' as const, content: 'How do I start?' }], pageId: '/docs/', locale: 'en',
});

test('real SDK spans contain the prompt, retrieved excerpt, answer, usage, and attribution in one trace', async () => {
  const input = request();
  const response = answerResponse({ ...input, corpus, model: answer(), signal: new AbortController().signal }, input, startTrace);
  const traceId = response.headers.get('X-Starport-Trace-Id');
  await response.text(); await Promise.all(completions);
  const spans = exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === traceId);
  assert.ok(spans.length >= 6);
  const root = spans.find((span) => span.name === 'Ask AI')!;
  assert.ok(root); assert.equal(root.parentSpanContext, undefined); assert.equal(root.attributes.outcome, 'finished');
  for (const span of spans) {
    assert.equal(span.attributes['posthog.distinct_id'], input.analytics.distinctId);
    assert.equal(span.attributes['$ai_session_id'], input.conversationId);
    assert.equal(span.attributes.attempt_id, input.attemptId);
    assert.equal(span.attributes.content_version, 'corpus-1');
  }
  const tool = spans.find((span) => span.attributes['gen_ai.tool.name'] === 'readPage')!;
  assert.ok(tool); assert.match(JSON.stringify(tool.attributes), /Run npm install/);
  assert.ok(spans.some((span) => span.attributes['gen_ai.system_instructions']));
  assert.match(String(root.attributes['$ai_output_state']), /Run npm install/);
  assert.ok(spans.some((span) => span.attributes['gen_ai.usage.input_tokens'] === 10));
  assert.equal(flushed.at(-1), exporter.getFinishedSpans().length);
  const child = spans.find((span) => span.parentSpanContext?.spanId === root.spanContext().spanId);
  assert.ok(child, 'SDK operation is a child of the answer attempt');
});

test('follow-ups and retries share the conversation but get independent traces, including concurrent visitors', async () => {
  const first = request();
  const followup = { ...first, attemptId: crypto.randomUUID(), messages: [...first.messages, { role: 'assistant' as const, content: 'Run npm install.' }, { role: 'user' as const, content: 'What next?' }] };
  const retry = { ...followup, attemptId: crypto.randomUUID() };
  const otherVisitor = request();
  otherVisitor.analytics.distinctId = 'another-visitor';
  const inputs = [first, followup, retry, otherVisitor];
  const ids = await Promise.all(inputs.map(async (input) => {
    const response = answerResponse({ ...input, corpus, model: answer(), signal: new AbortController().signal }, input, startTrace);
    await response.text(); return response.headers.get('X-Starport-Trace-Id');
  }));
  await Promise.all(completions);
  assert.equal(new Set(ids).size, 4);
  inputs.forEach((input, i) => {
    const spans = exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === ids[i]);
    assert.ok(spans.length >= 6);
    for (const span of spans) {
      assert.equal(span.attributes['$ai_session_id'], input.conversationId);
      assert.equal(span.attributes['posthog.distinct_id'], input.analytics.distinctId);
    }
  });
});

test('missing browser context disables full capture', async () => {
  registerTelemetry(new OpenTelemetry({ tracer: trace.getTracer('globally-enabled') }));
  const startedBefore = [...startedSpans.values()].reduce((total, spans) => total + spans.size, 0);
  const input = { ...request(), analytics: undefined };
  const response = answerResponse({ ...input, corpus, model: answer(), signal: new AbortController().signal }, input, startTrace);
  assert.equal(response.headers.get('X-Starport-Trace-Id'), null);
  await response.text();
  assert.ok(!exporter.getFinishedSpans().some((span) => span.attributes.attempt_id === input.attemptId));
  assert.equal([...startedSpans.values()].reduce((total, spans) => total + spans.size, 0), startedBefore);
});

test('cancellation closes all SDK spans before export and preserves the partial answer', { timeout: 3000 }, async () => {
  const input = request();
  const model = new MockLanguageModelV4({ doStream: async ({ abortSignal }) => ({ stream: new ReadableStream<LanguageModelV4StreamPart>({ start(controller) {
    controller.enqueue({ type: 'text-start', id: 't' }); controller.enqueue({ type: 'text-delta', id: 't', delta: 'Partial answer' });
    abortSignal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
  } }) }) });
  const response = answerResponse({ ...input, corpus, model, signal: new AbortController().signal }, input, startTrace);
  const reader = response.body!.getReader();
  while (true) { const { value, done } = await reader.read(); assert.equal(done, false); if (new TextDecoder().decode(value).includes('Partial answer')) break; }
  await reader.cancel(); await Promise.all(completions);
  const spans = exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === response.headers.get('X-Starport-Trace-Id'));
  assert.ok(spans.length >= 4);
  const root = spans.find((span) => span.name === 'Ask AI')!;
  assert.equal(root.attributes.outcome, 'aborted'); assert.match(String(root.attributes['$ai_output_state']), /Partial answer/);
  assert.deepEqual(new Set(spans.map((span) => span.spanContext().spanId)), startedSpans.get(root.spanContext().traceId), JSON.stringify([...startedSpans.get(root.spanContext().traceId)!].map((id) => [id, spanNames.get(id)])));
});

test('provider failure after partial output closes every span before completion', async () => {
  const input = request();
  const model = new MockLanguageModelV4({ doStream: async () => ({ stream: simulateReadableStream({ chunks: [
    { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Partial answer' }, { type: 'error', error: new Error('Upstream failed') },
  ] }) }) });
  const response = answerResponse({ ...input, corpus, model, signal: new AbortController().signal }, input, startTrace);
  await response.text(); await Promise.all(completions);
  const spans = exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === response.headers.get('X-Starport-Trace-Id'));
  const root = spans.find((span) => span.name === 'Ask AI')!;
  assert.equal(root.attributes.outcome, 'error'); assert.match(String(root.attributes['$ai_output_state']), /Partial answer/);
  assert.deepEqual(new Set(spans.map((span) => span.spanContext().spanId)), startedSpans.get(root.spanContext().traceId), JSON.stringify([...startedSpans.get(root.spanContext().traceId)!].map((id) => [id, spanNames.get(id)])));
});

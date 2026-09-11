import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV4 } from 'ai/test';
import { simulateReadableStream } from 'ai';
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider';
import { answerResponse } from '../src/server/response';
import type { AssistantTrace, TraceOutcome } from '../src/server/telemetry';
import { assistantMetadataSchema } from '../src/client/session';

const request = { conversationId: crypto.randomUUID(), attemptId: crypto.randomUUID(), messages: [{ role: 'user' as const, content: 'Hello' }], pageId: '/docs/', locale: 'en' };
const corpus = { contentVersion: 'build-1', search: () => [], readPage: () => null, pageId: () => undefined };
const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };
const answer = () => new MockLanguageModelV4({ doStream: async () => ({ stream: simulateReadableStream({ chunks: [
  { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Hello back' }, { type: 'text-end', id: 't' },
  { type: 'finish', usage, finishReason: { unified: 'stop', raw: 'stop' } },
] }) }) });

function recorder() {
  let completion: Promise<void> | undefined;
  const outcomes: TraceOutcome[] = [];
  const trace: AssistantTrace = {
    traceId: 'a'.repeat(32), telemetry: { isEnabled: false }, run: (generate) => generate(),
    waitUntil: (work) => { completion = work; },
    async finish(outcome) { outcomes.push({ ...outcome }); },
  };
  return { trace, outcomes, completion: async () => { assert.ok(completion); await completion; } };
}

test('response metadata identifies the exact answer and completion waits for export', async () => {
  const recorded = recorder();
  let exported = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  recorded.trace.finish = async () => { await gate; exported = true; };
  const response = answerResponse({ ...request, corpus, model: answer(), signal: new AbortController().signal }, request, () => recorded.trace);
  assert.equal(response.headers.get('X-Starport-Trace-Id'), recorded.trace.traceId);
  const chunks = (await response.text()).split('\n').filter((line) => line.startsWith('data: {')).map((line) => JSON.parse(line.slice(6)));
  assert.deepEqual(chunks.find((chunk) => chunk.type === 'start').messageMetadata, { conversationId: request.conversationId, attemptId: request.attemptId, traceId: recorded.trace.traceId });
  assert.equal(exported, false);
  release(); await recorded.completion(); assert.equal(exported, true);
});

test('telemetry initialization and export failures do not break an answer', async () => {
  const options = { ...request, corpus, model: answer(), signal: new AbortController().signal };
  const untraced = answerResponse(options, request, () => { throw new Error('Unavailable exporter'); });
  assert.match(await untraced.text(), /Hello back/);
  assert.equal(untraced.headers.get('X-Starport-Trace-Id'), null);
  const recorded = recorder();
  recorded.trace.finish = async () => { throw new Error('Export failed'); };
  assert.match(await answerResponse({ ...options, model: answer() }, request, () => recorded.trace).text(), /Hello back/);
  await recorded.completion();
});

test('custom trace IDs survive client validation; malformed IDs cannot break headers or answers', async () => {
  for (const traceId of [crypto.randomUUID(), 'vendor:trace-123', 'invalid\nheader', 'x'.repeat(257)]) {
    const recorded = recorder(); recorded.trace.traceId = traceId;
    const response = answerResponse({ ...request, corpus, model: answer(), signal: new AbortController().signal }, request, () => recorded.trace);
    const chunks = (await response.text()).split('\n').filter((line) => line.startsWith('data: {')).map((line) => JSON.parse(line.slice(6)));
    const metadata = assistantMetadataSchema.parse(chunks.find((chunk) => chunk.type === 'start').messageMetadata);
    assert.equal(metadata.traceId ?? null, response.headers.get('X-Starport-Trace-Id'));
    assert.ok(chunks.some((chunk) => chunk.type === 'text-delta' && chunk.delta === 'Hello back'));
    await recorded.completion(); assert.equal(recorded.outcomes.length, 1);
  }
});

test('provider errors produce one error outcome and a safe client error', async () => {
  const recorded = recorder();
  const model = new MockLanguageModelV4({ doStream: async () => { throw new Error('Sensitive upstream detail'); } });
  const body = await answerResponse({ ...request, corpus, model, signal: new AbortController().signal }, request, () => recorded.trace).text();
  await recorded.completion();
  assert.equal(recorded.outcomes.length, 1); assert.equal(recorded.outcomes[0].status, 'error');
  assert.match(body, /Please retry/); assert.doesNotMatch(body, /Sensitive upstream detail/);
});

test('downstream cancellation aborts generation and exports its partial answer once', { timeout: 3000 }, async () => {
  const recorded = recorder();
  let modelSignal: AbortSignal | undefined;
  const model = new MockLanguageModelV4({ doStream: async ({ abortSignal }) => {
    modelSignal = abortSignal;
    return { stream: new ReadableStream<LanguageModelV4StreamPart>({ start(controller) {
      controller.enqueue({ type: 'text-start', id: 't' }); controller.enqueue({ type: 'text-delta', id: 't', delta: 'Partial' });
      abortSignal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
    } }) };
  } });
  const response = answerResponse({ ...request, corpus, model, signal: new AbortController().signal }, request, () => recorded.trace);
  const reader = response.body!.getReader();
  while (true) {
    const { done, value } = await reader.read();
    assert.equal(done, false);
    if (new TextDecoder().decode(value).includes('Partial')) break;
  }
  await reader.cancel(); await recorded.completion();
  assert.equal(modelSignal?.aborted, true);
  assert.deepEqual(recorded.outcomes, [{ status: 'aborted', text: 'Partial' }]);
});

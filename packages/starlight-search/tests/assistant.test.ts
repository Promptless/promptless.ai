import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV4 } from 'ai/test';
import { createUIMessageStreamResponse, toUIMessageStream, simulateReadableStream } from 'ai';
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider';
import { answerQuestion } from '../src/server/assistant';
import type { Corpus } from '../src/server/corpus';

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 20, text: 20, reasoning: 0 } };
const finish = (reason: 'stop' | 'tool-calls'): LanguageModelV4StreamPart => ({ type: 'finish', usage, finishReason: { unified: reason, raw: reason } });
const corpus: Corpus = {
  contentVersion: 'test-build',
  search: () => [], pageId: (path) => path === '/docs/' ? path : undefined,
  readPage: (pageId) => pageId === '/docs/' ? { pageId, url: '/docs/', title: 'Setup', locale: 'en', sections: [{ id: 'setup', heading: 'Setup', markdown: 'Run `npm install`.' }] } : null,
};
const options = { corpus, pageId: '/docs/', locale: 'en', messages: [{ role: 'user' as const, content: 'Explain this page' }], signal: new AbortController().signal };

test('streams real tool activity and read content, then a cited answer', async () => {
  const model = new MockLanguageModelV4({ doStream: [
    { stream: simulateReadableStream({ chunks: [{ type: 'tool-call', toolCallId: 'read1', toolName: 'readPage', input: '{"pageId":"/docs/"}' }, finish('tool-calls')] }) },
    { stream: simulateReadableStream({ chunks: [{ type: 'text-start', id: 't1' }, { type: 'text-delta', id: 't1', delta: 'Run `npm install`. [Setup](/docs/)' }, { type: 'text-end', id: 't1' }, finish('stop')] }) },
  ] });
  const result = answerQuestion({ ...options, model });
  const response = createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
  const stream = await response.text();
  assert.match(stream, /tool-input-available/); assert.match(stream, /tool-output-available/);
  assert.match(stream, /Run `npm install`/); assert.match(stream, /text-delta/);
  assert.equal(model.doStreamCalls.length, 2);
  assert.match(JSON.stringify(model.doStreamCalls[1].prompt), /npm install/);
  assert.equal(model.doStreamCalls[0].maxOutputTokens, 1000);
  assert.deepEqual(model.doStreamCalls[0].providerOptions?.anthropic, { effort: 'low', thinking: { type: 'disabled' } });
});

test('forces a final response after three tool rounds', async () => {
  let round = 0;
  const model = new MockLanguageModelV4({ doStream: async (call) => {
    const id = String(++round);
    const chunks: LanguageModelV4StreamPart[] = call.toolChoice?.type === 'none'
      ? [{ type: 'text-start', id }, { type: 'text-delta', id, delta: 'The docs do not cover that.' }, { type: 'text-end', id }, finish('stop')]
      : [{ type: 'tool-call', toolCallId: id, toolName: 'search', input: '{"query":"missing"}' }, finish('tool-calls')];
    return { stream: simulateReadableStream({ chunks }) };
  } });
  const result = answerQuestion({ ...options, model });
  await result.consumeStream();
  assert.equal(model.doStreamCalls.length, 4);
  assert.equal(model.doStreamCalls[3].toolChoice?.type, 'none');
});

test('unknown pages return a tool error instead of reading arbitrary files', async () => {
  const model = new MockLanguageModelV4({ doStream: [
    { stream: simulateReadableStream({ chunks: [{ type: 'tool-call', toolCallId: 'read1', toolName: 'readPage', input: '{"pageId":"/etc/passwd"}' }, finish('tool-calls')] }) },
    { stream: simulateReadableStream({ chunks: [{ type: 'text-start', id: 't1' }, { type: 'text-delta', id: 't1', delta: 'Not in the docs.' }, { type: 'text-end', id: 't1' }, finish('stop')] }) },
  ] });
  await answerQuestion({ ...options, model }).consumeStream();
  assert.match(JSON.stringify(model.doStreamCalls[1].prompt), /not in the published search corpus/);
});

test('provider failures become a stream error without exposing upstream details', async () => {
  const model = new MockLanguageModelV4({ doStream: async () => { throw new Error('Sensitive upstream details'); } });
  const result = answerQuestion({ ...options, model });
  const response = createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream, onError: () => 'Please retry.' }) });
  const body = await response.text();
  assert.match(body, /Please retry/); assert.doesNotMatch(body, /Sensitive upstream/);
  assert.equal(model.doStreamCalls.length, 1);
});

test('request cancellation reaches the model abort signal', async () => {
  const controller = new AbortController();
  let modelSignal: AbortSignal | undefined;
  const model = new MockLanguageModelV4({ doStream: async (call) => {
    modelSignal = call.abortSignal;
    return { stream: new ReadableStream<LanguageModelV4StreamPart>({
      start(stream) {
        stream.enqueue({ type: 'text-start', id: 'x' });
        stream.enqueue({ type: 'text-delta', id: 'x', delta: 'Partial answer' });
        call.abortSignal?.addEventListener('abort', () => stream.error(new DOMException('Aborted', 'AbortError')), { once: true });
        setTimeout(() => controller.abort(), 10);
      },
    }) };
  } });
  const result = answerQuestion({ ...options, model, signal: controller.signal });
  await result.consumeStream();
  assert.equal(modelSignal?.aborted, true);
});

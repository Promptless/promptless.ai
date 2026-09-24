import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chat } from '@ai-sdk/react';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { ChatActions } from '../src/client/chat-actions';

function setup() {
  const actions = new ChatActions();
  let interrupted = false;
  let finishes = 0;
  const requests: { signal: AbortSignal; reject: (error: Error) => void; finish: () => void }[] = [];
  const waiters = new Map<number, () => void>();
  const transport: ChatTransport<UIMessage> = {
    // Hold even aborted fetches until explicitly released, as a slow transport
    // can do. This exercises the real SDK's late onFinish/status mutations.
    sendMessages: ({ abortSignal }) => new Promise((resolve, reject) => {
      requests.push({ signal: abortSignal!, reject, finish: () => resolve(new ReadableStream<UIMessageChunk>({
        start(stream) {
          for (const chunk of [
            { type: 'start', messageId: `answer-${requests.length}` },
            { type: 'text-start', id: 'text' },
            { type: 'text-delta', id: 'text', delta: 'An answer.' },
            { type: 'text-end', id: 'text' },
            { type: 'finish', finishReason: 'stop' },
          ] satisfies UIMessageChunk[]) stream.enqueue(chunk);
          stream.close();
        },
      })) });
      waiters.get(requests.length - 1)?.();
    }),
    reconnectToStream: async () => null,
  };
  const chat = new Chat({ transport,
    onFinish: ({ isAbort, isError }) => {
      finishes++;
      if (actions.acceptsEvents) interrupted = isAbort || isError;
    },
    onError: () => { if (actions.acceptsEvents) interrupted = true; },
  });
  return {
    chat, requests,
    started: (index: number): Promise<void> => requests[index] ? Promise.resolve() : new Promise((resolve) => { waiters.set(index, resolve); }),
    get interrupted() { return interrupted; },
    get finishes() { return finishes; },
    send: (text: string) => actions.run(chat.stop, () => { interrupted = false; return chat.sendMessage({ text }); }),
    retry: () => actions.run(chat.stop, () => { interrupted = false; return chat.regenerate(); }),
    clear: () => actions.run(chat.stop, () => { chat.messages = []; chat.clearError(); interrupted = false; }),
    stop: () => actions.run(chat.stop, () => { interrupted = true; }),
    settleAbort: (index = 0) => requests[index].reject(new DOMException('Aborted', 'AbortError')),
  };
}

test('clear waits for an aborted request and ignores its stale completion', { timeout: 1000 }, async () => {
  const ui = setup();
  const sending = ui.send('First question');
  await ui.started(0);
  assert.equal(ui.chat.status, 'submitted');
  const clearing = ui.clear();
  assert.equal(ui.requests[0].signal.aborted, true);
  ui.settleAbort();
  await Promise.all([sending, clearing]);
  assert.equal(ui.finishes, 1, 'the SDK really delivered the old callback');
  assert.deepEqual(ui.chat.messages, []);
  assert.equal(ui.chat.status, 'ready');
  assert.equal(ui.interrupted, false, 'an empty conversation must not show Retry');
  const next = ui.send('A fresh start');
  await ui.started(1);
  ui.requests[1].finish();
  await next;
  assert.equal(ui.chat.messages.length, 2);
});

test('replacement questions wait for settlement so old requests cannot reset new status', { timeout: 1000 }, async () => {
  const ui = setup();
  const first = ui.send('First');
  await ui.started(0);
  const replacement = ui.send('Replacement');
  assert.equal(ui.requests.length, 1);
  ui.settleAbort();
  await first;
  await ui.started(1);
  assert.equal(ui.requests.length, 2);
  assert.equal(ui.chat.status, 'submitted');
  assert.equal(ui.interrupted, false);
  const stopping = ui.stop();
  assert.equal(ui.requests[1].signal.aborted, true, 'Stop targets the replacement request');
  ui.settleAbort(1);
  await Promise.all([replacement, stopping]);
  assert.equal(ui.interrupted, true);
  const retrying = ui.retry();
  await ui.started(2);
  assert.equal(ui.chat.status, 'submitted');
  ui.requests[2].finish();
  await retrying;
  assert.equal(ui.chat.status, 'ready');
  assert.equal(ui.interrupted, false);
});

test('clear supersedes a retry that is still waiting for the old request', { timeout: 1000 }, async () => {
  const ui = setup();
  const first = ui.send('First');
  await ui.started(0);
  const retry = ui.retry();
  const clear = ui.clear();
  ui.settleAbort();
  await Promise.all([first, retry, clear]);
  assert.equal(ui.requests.length, 1, 'a superseded retry must not reach the transport');
  assert.deepEqual(ui.chat.messages, []);
  assert.equal(ui.interrupted, false);
});

test('provider failures still show interruption and allow retry', { timeout: 1000 }, async () => {
  const ui = setup();
  const first = ui.send('First');
  await ui.started(0);
  ui.requests[0].reject(new Error('Provider failed'));
  await first;
  assert.equal(ui.chat.status, 'error');
  assert.equal(ui.interrupted, true);
  const retry = ui.retry();
  await ui.started(1);
  ui.requests[1].finish();
  await retry;
  assert.equal(ui.chat.status, 'ready');
  assert.equal(ui.interrupted, false);
});

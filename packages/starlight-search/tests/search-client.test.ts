import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preloadIndex, queryIndex } from '../src/client/search-client';

test('browser search shares initialization, submits queries immediately, and recovers after worker failure', async () => {
  type Message = { id: number; query?: string; manifestUrl: string };
  const workers: FakeWorker[] = [];
  class FakeWorker {
    messages: Message[] = [];
    onmessage?: (event: { data: object }) => void;
    onerror?: () => void;
    terminated = false;
    constructor() { workers.push(this); }
    postMessage(message: Message) { this.messages.push(message); }
    terminate() { this.terminated = true; }
    reply(message: Message, data: object = { results: [], duration: 1 }) {
      this.onmessage?.({ data: { id: message.id, ...data } });
    }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  Object.defineProperty(globalThis, 'Worker', { configurable: true, value: FakeWorker });
  try {
    const preloaded = preloadIndex('/search/manifest.json');
    assert.equal(preloadIndex('/search/manifest.json'), preloaded);
    const first = queryIndex('/search/manifest.json', 'slack');
    const worker = workers[0];
    assert.equal(workers.length, 1);
    assert.equal(worker.messages.length, 1, 'queries wait for the shared index initialization');
    assert.equal(worker.messages[0].query, undefined);
    worker.reply(worker.messages[0]);
    await preloaded;
    assert.equal(worker.messages[1].query, 'slack', 'query submits without a debounce timer');
    worker.reply(worker.messages[1]);
    await first;

    const older = queryIndex('/search/manifest.json', 'slack s');
    const newer = queryIndex('/search/manifest.json', 'slack setup');
    await Promise.resolve();
    assert.equal(workers.length, 1);
    assert.deepEqual(worker.messages.slice(2).map((message) => message.query), ['slack s', 'slack setup']);
    worker.reply(worker.messages[3], { results: [], duration: 2 });
    worker.reply(worker.messages[2], { results: [], duration: 3 });
    assert.equal((await newer).duration, 2);
    assert.equal((await older).duration, 3, 'out-of-order replies remain associated with their own queries');

    const failing = queryIndex('/search/manifest.json', 'api');
    const rejected = assert.rejects(failing, /WORKER_UNAVAILABLE/);
    await Promise.resolve();
    worker.onerror?.();
    await rejected;
    assert.equal(worker.terminated, true);
    const retry = preloadIndex('/search/manifest.json');
    assert.equal(workers.length, 2, 'retry recreates the worker and its index readiness');
    workers[1].reply(workers[1].messages[0], { error: 'INDEX_UNAVAILABLE' });
    await assert.rejects(retry, /INDEX_UNAVAILABLE/);
    const recovered = preloadIndex('/search/manifest.json');
    workers[1].reply(workers[1].messages[1]);
    await recovered;
  } finally {
    workers.at(-1)?.onerror?.();
    if (original) Object.defineProperty(globalThis, 'Worker', original);
    else Reflect.deleteProperty(globalThis, 'Worker');
  }
});

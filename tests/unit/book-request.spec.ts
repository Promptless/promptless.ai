import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOOK_REQUEST_ENDPOINT, parseBookRequest, submitBookRequest } from '../../src/lib/book-request';

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ name: 'Synthetic Test', email: 'dogbench-test@example.invalid', company: '', physical_copy: 'yes', ...overrides })
    .forEach(([key, value]) => data.set(key, value));
  return data;
}
function valid() {
  const parsed = parseBookRequest(form());
  assert.equal(parsed.ok, true);
  if (!parsed.ok) throw new Error('Invalid fixture');
  return parsed.data;
}

test('requires trimmed contact details and an explicit copy preference', () => {
  for (const invalid of [{ name: ' ' }, { email: 'not-an-email' }, { email: 'x@y' }, { physical_copy: '' }, { physical_copy: 'maybe' }, { company: 'x'.repeat(161) }]) {
    assert.equal(parseBookRequest(form(invalid)).ok, false);
  }
  const parsed = parseBookRequest(form({ name: ' Synthetic Test ', physical_copy: 'no' }));
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.data.name, 'Synthetic Test');
});

test('persists only the intended fields and routes requests to the existing team inbox', async () => {
  let called = 0;
  const result = await submitBookRequest({ ...valid(), _gotcha: 'spam trap' }, async (url, init) => {
    called++;
    assert.equal(url, BOOK_REQUEST_ENDPOINT);
    assert.equal(init?.credentials, 'omit');
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload, {
      name: 'Synthetic Test', email: 'dogbench-test@example.invalid', company: '', physical_copy: 'yes', _gotcha: 'spam trap',
      form: 'dogbench_book_request', source: 'request_book', _email: { subject: 'Free DoGBench field guide request' },
    });
    return new Response('{}', { status: 200 });
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(called, 1);
});

test('does not show success or retry when spam, rate limits, or server errors reject a request', async () => {
  for (const status of [403, 429, 500]) {
    let called = 0;
    const result = await submitBookRequest(valid(), async () => { called++; return new Response('{}', { status }); });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(Boolean(result.rateLimited), status === 429);
    assert.equal(called, 1);
  }
});

test('connection failures are reported as uncertain and are never automatically retried', async () => {
  let called = 0;
  const result = await submitBookRequest(valid(), async () => { called++; throw new Error('offline'); });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.message, /couldn't confirm/);
  assert.equal(called, 1);
});

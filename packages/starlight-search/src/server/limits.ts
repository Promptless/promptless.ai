import { z } from 'zod';
import { budgetHistory, MAX_ANSWER_CHARS, MAX_QUESTION_CHARS, MAX_REQUEST_BYTES } from '../core/conversation';

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(MAX_ANSWER_CHARS),
  })).min(1).max(100),
  pageId: z.string().max(1_000).startsWith('/'),
  locale: z.string().max(30).default('en'),
});

export async function parseRequest(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RequestError(415, 'Send application/json.');
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES) throw new RequestError(413, 'Conversation is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, 'A question is required.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) { await reader.cancel(); throw new RequestError(413, 'Conversation is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let json: unknown;
  try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError(400, 'Invalid JSON.'); }
  const parsed = inputSchema.safeParse(json);
  if (!parsed.success) throw new RequestError(400, 'Invalid conversation.');
  const input = parsed.data;
  if (input.messages.at(-1)?.role !== 'user' || input.messages.some((message, i) =>
    message.role !== (i % 2 === 0 ? 'user' : 'assistant') || (message.role === 'user' && message.content.length > MAX_QUESTION_CHARS))) {
    throw new RequestError(400, 'Use complete turns ending with a question of at most 4,000 characters.');
  }
  return { ...input, messages: budgetHistory(input.messages) };
}

/** Approximate abuse protection for one process, not a distributed spending cap. */
export function createThrottle(limit = 20, windowMs = 600_000, capacity = 10_000) {
  const entries = new Map<string, { count: number; reset: number }>();
  return (ip: string, now = Date.now()) => {
    const entry = entries.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= limit) return Math.ceil((entry.reset - now) / 1000);
      entry.count++;
      return 0;
    }
    if (entries.size >= capacity) {
      for (const [key, value] of entries) if (value.reset <= now) entries.delete(key);
      if (entries.size >= capacity) return 60;
    }
    entries.set(ip, { count: 1, reset: now + windowMs });
    return 0;
  };
}

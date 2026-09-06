import type { APIRoute } from 'astro';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { artifactDir } from 'virtual:starport-search/server';
import { loadCorpus, type Corpus } from './corpus';
import { answerQuestion } from './assistant';
import { createThrottle, parseRequest, RequestError } from './limits';

export const prerender = false;
const throttle = createThrottle();
let corpusPromise: Promise<Corpus> | undefined;
const errorResponse = (status: number, error: string, headers: Record<string, string> = {}) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return errorResponse(503, 'The assistant is not configured. Search is still available.');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return errorResponse(403, 'Use the assistant on this site.');
  const retryAfter = throttle(clientAddress || 'unknown');
  if (retryAfter) return errorResponse(429, 'Too many questions. Please try again later.', { 'Retry-After': String(retryAfter) });
  try {
    const input = await parseRequest(request, signal);
    // A failed load is retriable, but never silently becomes an empty corpus.
    corpusPromise ??= loadCorpus(artifactDir).catch((error) => { corpusPromise = undefined; throw error; });
    const corpus = await corpusPromise;
    signal.throwIfAborted();
    const result = answerQuestion({
      model: createAnthropic({ apiKey: key })(process.env.STARPORT_ASSISTANT_MODEL || 'claude-sonnet-5'),
      corpus, ...input, pageId: corpus.pageId(input.pageId), signal,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream, onError: () => 'The assistant could not finish. Please retry.' }),
      headers: { 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
    });
  } catch (error) {
    if (signal.aborted) return errorResponse(408, 'The assistant request was interrupted. Please retry.');
    if (error instanceof RequestError) return errorResponse(error.status, error.message);
    // Never log questions, provider payloads, secrets, or tool transcripts.
    console.error('[starport-search] Assistant request failed', error instanceof Error ? error.name : 'UnknownError');
    return errorResponse(503, 'The assistant is temporarily unavailable. Please retry.');
  }
};

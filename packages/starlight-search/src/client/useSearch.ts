import { useEffect, useRef, useState } from 'react';
import type { SearchResult } from '../core/types';
import { preloadIndex, queryIndex } from './search-client';
import { track } from './events';

type Response = { query: string; locale: string } & (
  | { status: 'success'; results: SearchResult[]; latency: number; duration: number }
  | { status: 'error' }
);
const EMPTY_RESULTS: SearchResult[] = [];

export function useSearch(manifestUrl: string, input: string, locale: string, open: boolean) {
  const query = input.trim();
  const [indexStatus, setIndexStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [response, setResponse] = useState<Response>();
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);
  const requestStarted = useRef(0);
  const currentResponse = response?.query === query && response.locale === locale ? response : undefined;
  const error = indexStatus === 'error' || currentResponse?.status === 'error';
  const pending = open && !error && (indexStatus === 'loading' || Boolean(query && !currentResponse));

  useEffect(() => { requestStarted.current = performance.now(); }, [query, locale, open, attempt]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIndexStatus('loading');
    void preloadIndex(manifestUrl).then(() => {
      if (!cancelled) setIndexStatus('ready');
    }).catch(() => {
      if (cancelled) return;
      setIndexStatus('error');
      track('search_error', { code: 'index_unavailable' });
    });
    return () => { cancelled = true; };
  }, [manifestUrl, open, attempt]);

  useEffect(() => {
    if (!open || indexStatus !== 'ready' || !query || currentResponse) return;
    let cancelled = false;
    const start = requestStarted.current;
    void queryIndex(manifestUrl, query, { locale }).then((reply) => {
      if (cancelled) return;
      setResponse({ status: 'success', query, locale, results: reply.results,
        latency: Math.round(performance.now() - start), duration: reply.duration });
    }).catch(() => {
      if (cancelled) return;
      setResponse({ status: 'error', query, locale });
      track('search_error', { code: 'query_failed' });
    });
    return () => { cancelled = true; };
  }, [manifestUrl, open, indexStatus, query, locale, currentResponse]);

  // Delay only the progress affordance and analytics, never the search itself.
  useEffect(() => {
    if (!pending) { setSlow(false); return; }
    const timer = setTimeout(() => setSlow(true), 250);
    return () => clearTimeout(timer);
  }, [pending]);
  useEffect(() => {
    if (!open || pending || currentResponse?.status !== 'success') return;
    const timer = setTimeout(() => track('search_query', { query, results: currentResponse.results.length,
      latency_ms: currentResponse.latency, query_ms: currentResponse.duration }), 200);
    return () => clearTimeout(timer);
  }, [open, pending, query, currentResponse]);

  // Retain the last completed result set while its replacement is in flight.
  // Empty input and locale changes must never expose those previous results.
  const results = query && !error && response?.status === 'success' && response.locale === locale
    ? response.results : EMPTY_RESULTS;
  const retry = () => { setResponse(undefined); setIndexStatus('loading'); setAttempt((n) => n + 1); };
  return { results, resultQuery: response?.status === 'success' ? response.query : '',
    error, pending, showProgress: pending && slow, retry };
}

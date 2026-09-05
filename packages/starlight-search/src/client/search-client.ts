import type { SearchFilters, SearchResult } from '../core/types';
interface Reply { results: SearchResult[]; duration: number }
let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, { resolve: (value: Reply) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();

export function queryIndex(manifestUrl: string, query?: string, filters: SearchFilters = {}): Promise<Reply> {
  if (!worker) {
    worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const request = pending.get(data.id);
      if (!request) return;
      clearTimeout(request.timer);
      pending.delete(data.id);
      if (data.error) request.reject(new Error(data.error));
      else request.resolve(data);
    };
    worker.onerror = () => {
      for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('WORKER_UNAVAILABLE')); }
      pending.clear(); worker?.terminate(); worker = undefined;
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('SEARCH_TIMEOUT')); }, 15_000);
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, manifestUrl, query, filters });
  });
}

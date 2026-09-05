/// <reference lib="webworker" />
import { loadIndex, search } from '../core/search';
import type { SearchArtifact } from '../core/types';

let index: ReturnType<typeof loadIndex> | undefined;
let loading: Promise<void> | undefined;
self.onmessage = async (event: MessageEvent<{ id: number; query?: string; manifestUrl: string }>) => {
  const { id, query, manifestUrl } = event.data;
  try {
    loading ??= (async () => {
      const signal = AbortSignal.timeout(14_000);
      const response = await fetch(manifestUrl, { cache: 'no-store', signal });
      if (!response.ok) throw new Error('INDEX_UNAVAILABLE');
      const manifest = await response.json();
      const data = await fetch(new URL(manifest.index, new URL(manifestUrl, self.location.origin)), { signal });
      if (!data.ok) throw new Error('INDEX_UNAVAILABLE');
      index = loadIndex(await data.json() as SearchArtifact);
    })().catch((error) => { loading = undefined; throw error; });
    await loading;
    const start = performance.now();
    const results = query ? search(index!, query) : [];
    self.postMessage({ id, results, duration: performance.now() - start });
  } catch { self.postMessage({ id, error: 'INDEX_UNAVAILABLE' }); }
};

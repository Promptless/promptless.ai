import { useEffect, useState } from 'react';

/** Check the tiny manifest on opening in development, without reloading the cached index. */
export function useDevIndex(manifestUrl: string, open: boolean, enabled: boolean) {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!enabled || !open) return;
    const controller = new AbortController();
    void fetch(manifestUrl, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      if (response.ok) setStale((await response.json()).stale === true);
    }).catch(() => { /* The search loader presents manifest failures and retry. */ });
    return () => controller.abort();
  }, [manifestUrl, open, enabled]);
  return stale;
}

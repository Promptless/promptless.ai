/**
 * Browser client for starting and polling Agent Score scans, plus the shared
 * progress panel renderer used by the scan form and the Rescan button.
 */
import { CHECK_NAMES } from '../meta';
import type { CreateScanResponse, ScanStatusResponse } from '../types';

export class ScanRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const POLL_INTERVAL_MS = 2_000;
// The backend kills afdocs after 300 s and marks stale scans failed after 10
// minutes; stop polling a little after that so a tab never polls forever.
const POLL_GIVE_UP_MS = 11 * 60 * 1000;

async function readError(response: Response): Promise<ScanRequestError> {
  const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  const fallback =
    response.status === 429
      ? 'Too many scans from your network right now. Try again later.'
      : 'Could not start the scan. Please try again.';
  return new ScanRequestError(body.message || fallback, body.error || 'request_failed', response.status);
}

export async function startScan(apiBase: string, url: string, website = ''): Promise<CreateScanResponse> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, website }),
    });
  } catch {
    throw new ScanRequestError('The scoring service is unreachable. Check your connection and try again.', 'network', 0);
  }
  if (!response.ok) throw await readError(response);
  return (await response.json()) as CreateScanResponse;
}

export async function getScan(apiBase: string, scanId: string): Promise<ScanStatusResponse> {
  const response = await fetch(`${apiBase}/scans/${encodeURIComponent(scanId)}`, { cache: 'no-store' });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as ScanStatusResponse;
}

/**
 * Poll until the scan completes or fails. Transient network errors are
 * retried; `onUpdate` sees every status response.
 */
export async function pollScan(
  apiBase: string,
  scanId: string,
  onUpdate: (status: ScanStatusResponse) => void,
): Promise<ScanStatusResponse> {
  const startedAt = Date.now();
  let failures = 0;
  for (;;) {
    try {
      const status = await getScan(apiBase, scanId);
      failures = 0;
      onUpdate(status);
      if (status.status === 'complete' || status.status === 'failed') return status;
    } catch (error) {
      failures += 1;
      if (error instanceof ScanRequestError && error.status === 404) throw error;
      if (failures >= 5) throw new ScanRequestError('Lost contact with the scoring service.', 'network', 0);
    }
    if (Date.now() - startedAt > POLL_GIVE_UP_MS) {
      throw new ScanRequestError('The scan is taking unusually long. Reload the page later to see the result.', 'timeout', 0);
    }
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

export function friendlyCheckName(id: string | null | undefined): string {
  if (!id) return '';
  return CHECK_NAMES[id] ?? id;
}

const ERROR_COPY: Record<string, string> = {
  timeout: 'The scan timed out. The site may be slow, very large, or blocking automated requests.',
  unreachable: 'We could not reach that site. Check the URL, and that it is publicly accessible.',
  afdocs_failed: 'afdocs could not finish scanning this site.',
};

export interface ProgressElements {
  root: HTMLElement;
  title: HTMLElement;
  count: HTMLElement;
  bar: HTMLElement;
  detail: HTMLElement;
}

export function getProgressElements(root: HTMLElement): ProgressElements {
  const pick = (name: string) => root.querySelector<HTMLElement>(`[data-progress="${name}"]`) as HTMLElement;
  return { root, title: pick('title'), count: pick('count'), bar: pick('bar'), detail: pick('detail') };
}

/** Render a scan status into a `.pl-as-progress` panel. */
export function renderProgress(els: ProgressElements, status: Pick<ScanStatusResponse, 'status' | 'progress' | 'error' | 'slug'>, startedAt: number): void {
  const { progress } = status;
  const total = progress?.total || 28;
  const completed = Math.min(progress?.completed ?? 0, total);
  const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  els.root.hidden = false;
  els.root.dataset.state = status.status;

  if (status.status === 'failed') {
    els.title.textContent = `Scan of ${status.slug} failed`;
    els.count.textContent = '';
    els.bar.style.width = `${(completed / total) * 100}%`;
    els.detail.textContent = status.error?.message || ERROR_COPY[status.error?.code ?? ''] || 'The scan failed.';
    if (status.error?.code && ERROR_COPY[status.error.code] && status.error.message !== ERROR_COPY[status.error.code]) {
      els.detail.textContent = `${ERROR_COPY[status.error.code]} (${status.error.message})`;
    }
    return;
  }

  if (status.status === 'queued') {
    els.title.textContent = `Queued: ${status.slug}`;
    els.count.textContent = `${elapsed}s`;
    els.bar.style.width = '';
    els.detail.textContent = 'Waiting for a scanner. Scans usually take 30 to 120 seconds.';
    return;
  }

  if (status.status === 'complete') {
    els.title.textContent = `Scored ${status.slug}`;
    els.count.textContent = `${total}/${total} checks`;
    els.bar.style.width = '100%';
    els.detail.textContent = 'Loading the report…';
    return;
  }

  els.title.textContent = `Scanning ${status.slug}`;
  els.count.textContent = `${completed}/${total} checks · ${elapsed}s`;
  els.bar.style.width = `${Math.max(4, (completed / total) * 100)}%`;
  const current = friendlyCheckName(progress?.currentCheck);
  els.detail.replaceChildren();
  if (current) {
    const code = document.createElement('code');
    code.textContent = progress?.currentCheck ?? '';
    els.detail.append(`Checking ${current} `, code);
  } else {
    els.detail.textContent = 'Discovering pages from llms.txt and the sitemap…';
  }
}

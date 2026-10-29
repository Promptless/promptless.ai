/** Acquisition evidence carried from the website to the account signup flow. */
export interface SignupAttribution {
  version: 1;
  captured_at: string;
  landing_path: string;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  source: string;
  evidence: 'utm' | 'referrer' | 'direct' | 'unavailable';
}

const STORAGE_KEY = 'promptless.signup-attribution.v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const APP_ORIGINS = new Set(['https://app.gopromptless.ai', 'https://app.promptless.ai']);

function matchesHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function sourceForHost(host: string): string {
  for (const [domain, source] of [['chatgpt.com', 'chatgpt'], ['chat.openai.com', 'chatgpt'], ['claude.ai', 'claude'], ['claude.com', 'claude'], ['linkedin.com', 'linkedin'], ['lnkd.in', 'linkedin'], ['bing.com', 'bing']]) {
    if (matchesHost(host, domain)) return source;
  }
  if (/^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host)) return 'google';
  return 'referral';
}

function campaignSource(source: string): string {
  const aliases: Record<string, string> = { openai: 'chatgpt', 'chatgpt.com': 'chatgpt', 'chat.openai.com': 'chatgpt', 'claude.ai': 'claude', 'claude.com': 'claude', anthropic: 'claude', 'linkedin.com': 'linkedin', 'lnkd.in': 'linkedin' };
  const normalized = source.toLowerCase();
  return aliases[normalized] ?? (normalized.replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'campaign');
}

/** Capture bounded campaign fields, the landing path, and a referring host. */
export function observeSignupAttribution(href: string, referrer: string, now = new Date()): SignupAttribution {
  const url = new URL(href);
  const field = (name: string): string | null => url.searchParams.get(name)?.trim().slice(0, 200) || null;
  let host: string | null = null;
  try {
    const parsed = new URL(referrer);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') host = parsed.hostname.toLowerCase();
  } catch {
    // A browser can omit the referring page.
  }
  const source = field('utm_source');
  const internal = host !== null && ['promptless.ai', 'gopromptless.ai'].some((domain) => matchesHost(host!, domain));
  return {
    version: 1,
    captured_at: now.toISOString(),
    landing_path: url.pathname.slice(0, 300),
    referrer_host: host,
    utm_source: source,
    utm_medium: field('utm_medium'),
    utm_campaign: field('utm_campaign'),
    source: source ? campaignSource(source) : internal ? 'unknown' : host ? sourceForHost(host) : 'direct',
    evidence: source ? 'utm' : internal ? 'unavailable' : host ? 'referrer' : 'direct',
  };
}

function readAttribution(raw: string | null, now: Date): SignupAttribution | null {
  if (raw === null || raw.length > 2048) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Partial<SignupAttribution>;
    if (record.version !== 1 || typeof record.captured_at !== 'string' || typeof record.landing_path !== 'string' || !record.landing_path.startsWith('/') || record.landing_path.startsWith('//')) return null;
    if (![record.referrer_host, record.utm_source, record.utm_medium, record.utm_campaign].every((field) => field === null || typeof field === 'string')) return null;
    const age = now.getTime() - Date.parse(record.captured_at);
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return null;
    const landing = new URL(record.landing_path.slice(0, 300), 'https://promptless.ai');
    for (const name of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
      const field = record[name];
      if (typeof field === 'string') landing.searchParams.set(name, field.slice(0, 200));
    }
    const host = typeof record.referrer_host === 'string' && /^[a-z0-9.-]{1,253}$/.test(record.referrer_host) ? record.referrer_host : null;
    return observeSignupAttribution(landing.toString(), host ? `https://${host}/` : '', new Date(record.captured_at));
  } catch {
    return null;
  }
}

/** Retain first touch for thirty days, including across visits to different website pages. */
export function captureSignupAttribution(href: string, referrer: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null, now = new Date()): SignupAttribution {
  let saved: SignupAttribution | null = null;
  try {
    saved = readAttribution(storage?.getItem(STORAGE_KEY) ?? null, now);
  } catch (error: unknown) {
    console.warn('Signup attribution storage is unavailable', error);
  }
  const observed = observeSignupAttribution(href, referrer, now);
  const attribution = saved === null || (saved.source === 'unknown' && observed.source !== 'unknown' && observed.source !== 'direct') ? observed : saved;
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch (error: unknown) {
    console.warn('Signup attribution could not be persisted', error);
  }
  return attribution;
}

/** Append the allowlisted acquisition payload only to Promptless's HTTPS app origins. */
export function attributedAppHref(href: string, base: string, attribution: SignupAttribution): string {
  try {
    const url = new URL(href, base);
    if (!APP_ORIGINS.has(url.origin) || url.username || url.password) return href;
    url.searchParams.set('signup_attribution', JSON.stringify(attribution));
    return url.toString();
  } catch {
    return href;
  }
}

/** Decorate app links before ordinary, keyboard, or new-tab navigation. */
export function installSignupAttribution(): void {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch (error: unknown) {
    console.warn('Signup attribution storage is unavailable', error);
  }
  const attribution = captureSignupAttribution(window.location.href, document.referrer, storage);
  const decorate = (anchor: HTMLAnchorElement): void => {
    const href = anchor.getAttribute('href');
    if (href) anchor.setAttribute('href', attributedAppHref(href, window.location.href, attribution));
  };
  const decoratePage = (): void => document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(decorate);
  decoratePage();
  document.addEventListener('astro:page-load', decoratePage);
  for (const eventName of ['pointerdown', 'click', 'auxclick', 'contextmenu', 'keydown']) {
    document.addEventListener(eventName, (event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement) decorate(anchor);
    }, true);
  }
}

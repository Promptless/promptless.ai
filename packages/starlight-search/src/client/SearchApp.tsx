import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ClientConfig, SearchResult } from '../core/types';
import { excerpt } from '../core/excerpt';
import { translations } from './i18n';
import { queryIndex } from './search-client';
import { track } from './events';
import { readSession, writeSession } from './session';

const Assistant = lazy(() => import('./Assistant'));
const OPEN_KEY = 'starport:panel:v1';

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const pattern = terms.filter(Boolean).sort((a, b) => b.length - a.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!pattern) return <>{text}</>;
  return <>{text.split(new RegExp(`(${pattern})`, 'gi')).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part)}</>;
}

export default function SearchApp({ config }: { config: ClientConfig }) {
  const [locale, setLocale] = useState('en');
  const t = translations(locale);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<{ text: string; id: number }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const requestCounter = useRef(0);
  const restoreFocus = () => {
    const previous = returnFocus.current;
    if (previous?.isConnected && previous.getClientRects().length) previous.focus();
    else document.querySelector<HTMLElement>('[data-starport-search]')?.focus();
  };
  const preload = () => { void queryIndex(config.manifestUrl).catch(() => {}); };

  useEffect(() => {
    setLocale(document.documentElement.lang || 'en');
    if (config.assistant && readSession<boolean>(OPEN_KEY, false)) { setPanel(true); setMounted(true); }
    const show = () => { returnFocus.current = document.activeElement as HTMLElement; setOpen(true); preload(); };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-starport-search]')) show();
      if (target?.closest('[data-starport-ask]') && config.assistant) {
        returnFocus.current = document.activeElement as HTMLElement; setMounted(true); setPanel(true);
      }
    };
    const approach = (event: Event) => { if (event.target instanceof Element && event.target.closest('[data-starport-search]')) preload(); };
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); show(); }
    };
    document.addEventListener('click', click);
    document.addEventListener('pointerover', approach, { passive: true });
    document.addEventListener('focusin', approach);
    document.addEventListener('keydown', key);
    document.querySelectorAll('[data-starport-search] kbd').forEach((kbd) => { kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'; });
    return () => {
      document.removeEventListener('click', click); document.removeEventListener('pointerover', approach);
      document.removeEventListener('focusin', approach); document.removeEventListener('keydown', key);
    };
  }, [config]);

  useEffect(() => {
    if (open) { dialog.current?.showModal(); input.current?.focus(); }
    else if (dialog.current?.open) { dialog.current.close(); restoreFocus(); }
  }, [open]);
  useEffect(() => {
    document.documentElement.toggleAttribute('data-starport-assistant', panel);
    writeSession(OPEN_KEY, panel);
    return () => document.documentElement.removeAttribute('data-starport-assistant');
  }, [panel]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = performance.now();
    setLoading(true); setError(false); setSelected(0);
    const timer = setTimeout(() => {
      void queryIndex(config.manifestUrl, query, { locale }).then((reply) => {
        if (cancelled) return;
        setResults(reply.results); setLoading(false);
        if (query.trim()) track('search_query', { query: query.trim(), results: reply.results.length, latency_ms: Math.round(performance.now() - start), query_ms: reply.duration });
      }).catch(() => {
        if (cancelled) return;
        setResults([]); setLoading(false); setError(true); track('search_error', { code: 'index_unavailable' });
      });
    }, 70);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open, locale, config.manifestUrl]);
  useEffect(() => { dialog.current?.querySelector(`#sp-result-${selected}`)?.scrollIntoView({ block: 'nearest' }); }, [selected]);

  const ask = () => {
    if (!config.assistant || !query.trim()) return;
    setOpen(false); setMounted(true); setPanel(true);
    setInitialQuestion({ text: query.trim(), id: ++requestCounter.current });
  };
  const navigate = (result: SearchResult) => {
    track('search_result_click', { query, url: result.url, position: results.indexOf(result) + 1 });
    setOpen(false); window.location.assign(result.url);
  };
  const askOption = config.assistant && Boolean(query.trim());
  const count = results.length + (askOption ? 1 : 0);
  return <>
    <dialog className="sp-modal" ref={dialog} aria-label={t.search} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="sp-modal-inner">
        <div className="sp-query-row">
          <span className="sp-search-icon" aria-hidden="true">⌕</span>
          <input ref={input} value={query} maxLength={300} onChange={(event) => setQuery(event.target.value)} placeholder={t.placeholder} aria-label={t.search}
            role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="sp-results" aria-activedescendant={count ? `sp-result-${selected}` : undefined}
            autoComplete="off" spellCheck="false" data-ph-unmask onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (count) setSelected((selected + (event.key === 'ArrowDown' ? 1 : -1) + count) % count); }
              if (event.key === 'Enter') { event.preventDefault(); if (event.altKey || selected === results.length) ask(); else if (results[selected]) navigate(results[selected]); }
            }} />
          {config.assistant && <button className="sp-ask-query" aria-label={t.ask} title={t.ask} disabled={!query.trim()} onClick={ask}><span className="sp-ask-label">{t.ask}</span><span aria-hidden="true">✦</span></button>}
          <button className="sp-icon-button sp-mobile-close" onClick={() => setOpen(false)} aria-label={t.close}>×</button>
        </div>
        {config.dev && <p className="sp-dev-note">{t.dev}</p>}
        <div className="sp-result-scroll">
          <div role="status" className="sp-status">{error ? (config.dev ? t.missing : t.searchError) : loading ? t.loading : !query.trim() ? t.start : !results.length ? t.noResults : ''}
            {error && <button onClick={() => { setOpen(false); setTimeout(() => setOpen(true), 0); }}>{t.retry}</button>}
          </div>
          <div id="sp-results" role="listbox" aria-label={t.search} aria-busy={loading}>
            {results.map((result, i) => <a key={result.id} id={`sp-result-${i}`} role="option" aria-selected={selected === i} className="sp-result" tabIndex={-1} href={result.url}
              onPointerMove={() => setSelected(i)} onClick={(event) => { event.preventDefault(); navigate(result); }}>
              <span className="sp-result-icon" aria-hidden="true">{result.sectionId ? '#' : '▤'}</span>
              <span className="sp-result-content"><span className="sp-result-title"><Highlight text={result.sectionId ? result.heading : result.title} terms={result.terms} /></span>
                <span className="sp-breadcrumb">{[...result.breadcrumbs, ...(result.sectionId ? [result.title] : [])].join(' › ')}</span>
                <span className="sp-excerpt"><Highlight text={excerpt(result.text, result.terms)} terms={result.terms} /></span>
              </span><span className="sp-result-enter" aria-hidden="true">↵</span>
            </a>)}
            {askOption && <button id={`sp-result-${results.length}`} role="option" aria-selected={selected === results.length} className="sp-result sp-ask-result" tabIndex={-1} onPointerMove={() => setSelected(results.length)} onClick={ask}>
              <span aria-hidden="true">✦</span><span>{t.ask}: <strong>{query}</strong></span><span aria-hidden="true">↵</span>
            </button>}
          </div>
        </div>
        <footer className="sp-search-footer"><span>↑ ↓ <span>{t.select}</span>　↵ <span>{t.open}</span></span><button onClick={() => setOpen(false)}><kbd>Esc</kbd> {t.close}</button></footer>
      </div>
    </dialog>
    {mounted && config.assistant && <Suspense fallback={panel ? <aside className="sp-panel" aria-label={t.assistant}><header className="sp-panel-header"><h2>✦ {t.assistant}</h2><button className="sp-icon-button" aria-label={t.close} onClick={() => { setPanel(false); requestAnimationFrame(restoreFocus); }}>×</button></header><p className="sp-status" role="status">{t.loadingAssistant}</p></aside> : null}>
      <Assistant open={panel} config={config} t={t} initialQuestion={initialQuestion} onClose={() => { setPanel(false); requestAnimationFrame(restoreFocus); }} />
    </Suspense>}
  </>;
}

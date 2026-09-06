import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ClientConfig, SearchResult } from '../core/types';
import { excerpt } from '../core/excerpt';
import { translations } from './i18n';
import { preloadIndex } from './search-client';
import { useSearch } from './useSearch';
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
  const { results, resultQuery, pending, showProgress, error, retry } = useSearch(config.manifestUrl, query, locale, open);
  const entries = useMemo(() => results.flatMap((result, pageIndex) => [{
    id: result.id, url: result.url, title: result.title, breadcrumbs: result.breadcrumbs,
    text: result.description || result.text, terms: result.terms, section: false, position: pageIndex + 1,
  }, ...result.sections.map((section) => ({
    id: section.id, url: section.url, title: section.heading, breadcrumbs: [],
    text: section.text, terms: section.terms, section: true, position: pageIndex + 1,
  }))]), [results]);
  const [selection, setSelection] = useState<{ results: SearchResult[]; index: number }>();
  const selected = selection?.results === results ? Math.min(selection.index, entries.length) : 0;
  const setSelected = (index: number) => setSelection({ results, index });
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const requestCounter = useRef(0);
  const restoreFocus = () => {
    const previous = returnFocus.current;
    if (previous?.isConnected && previous.getClientRects().length) previous.focus();
    else document.querySelector<HTMLElement>('[data-starport-search]')?.focus();
  };
  const preload = () => { void preloadIndex(config.manifestUrl).catch(() => {}); };

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
  useEffect(() => { dialog.current?.querySelector(`#sp-result-${selected}`)?.scrollIntoView({ block: 'nearest' }); }, [selected, results]);

  const ask = () => {
    if (!config.assistant) return;
    setOpen(false); setMounted(true); setPanel(true);
    if (query.trim()) setInitialQuestion({ text: query.trim(), id: ++requestCounter.current });
  };
  const navigate = (entry: typeof entries[number]) => {
    track('search_result_click', { query: resultQuery, url: entry.url, position: entry.position });
    setOpen(false); window.location.assign(entry.url);
  };
  const askOption = config.assistant && Boolean(query.trim());
  const count = entries.length + (askOption ? 1 : 0);
  return <>
    <dialog className="sp-modal" ref={dialog} aria-label={t.search} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="sp-modal-inner">
        <div className="sp-query-row">
          <span className="sp-search-icon" aria-hidden="true">⌕</span>
          <input ref={input} value={query} maxLength={300} onChange={(event) => setQuery(event.target.value)} placeholder={t.placeholder} aria-label={t.search}
            role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="sp-results" aria-activedescendant={count ? `sp-result-${selected}` : undefined}
            autoComplete="off" spellCheck="false" data-ph-unmask onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (count) setSelected((selected + (event.key === 'ArrowDown' ? 1 : -1) + count) % count); }
              if (event.key === 'Enter') { event.preventDefault(); if (event.altKey || selected === entries.length) ask(); else if (entries[selected]) navigate(entries[selected]); }
            }} />
          {config.assistant && <button className="sp-ask-query" aria-label={t.ask} title={t.ask} onClick={ask}><span className="sp-ask-label">{t.ask}</span><span aria-hidden="true">✦</span></button>}
          <button className="sp-icon-button sp-mobile-close" onClick={() => setOpen(false)} aria-label={t.close}>×</button>
        </div>
        {config.dev && <p className="sp-dev-note">{t.dev}</p>}
        <div className="sp-result-scroll">
          <div role="status" className="sp-status">{error ? (config.dev ? t.missing : t.searchError) : !query.trim() ? t.start : !pending && !results.length ? t.noResults : ''}
            {error && <button onClick={() => { retry(); input.current?.focus(); }}>{t.retry}</button>}
          </div>
          <div id="sp-results" role="listbox" aria-label={t.search} aria-busy={pending}>
            {entries.map((entry, i) => <a key={entry.id} id={`sp-result-${i}`} role="option" aria-selected={selected === i} className={`sp-result${entry.section ? ' sp-section-result' : ''}`} tabIndex={-1} href={entry.url}
              onPointerMove={() => setSelected(i)} onClick={(event) => { event.preventDefault(); navigate(entry); }}>
              <span className="sp-result-icon" aria-hidden="true">{entry.section ? '#' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M8 12h8M8 16h8M8 8h2" />
              </svg>}</span>
              <span className="sp-result-content"><span className="sp-result-title"><Highlight text={entry.title} terms={entry.terms} /></span>
                {entry.breadcrumbs.length > 0 && <span className="sp-breadcrumb">{entry.breadcrumbs.join(' › ')}</span>}
                <span className="sp-excerpt"><Highlight text={excerpt(entry.text, entry.terms)} terms={entry.terms} /></span>
              </span><span className="sp-result-enter" aria-hidden="true">↵</span>
            </a>)}
            {askOption && <button id={`sp-result-${entries.length}`} role="option" aria-selected={selected === entries.length} className="sp-result sp-ask-result" tabIndex={-1} onPointerMove={() => setSelected(entries.length)} onClick={ask}>
              <span aria-hidden="true">✦</span><span>{t.ask}: <strong>{query}</strong></span><span aria-hidden="true">↵</span>
            </button>}
          </div>
        </div>
        <footer className="sp-search-footer"><span>↑ ↓ <span>{t.select}</span>　↵ <span>{t.open}</span></span><span className="sp-search-progress" role="status">{showProgress ? t.loading : ''}</span><button onClick={() => setOpen(false)}><kbd>Esc</kbd> {t.close}</button></footer>
      </div>
    </dialog>
    {mounted && config.assistant && <Suspense fallback={panel ? <aside className="sp-panel" aria-label={t.assistant}><header className="sp-panel-header"><h2>✦ {t.assistant}</h2><button className="sp-icon-button" aria-label={t.close} onClick={() => { setPanel(false); requestAnimationFrame(restoreFocus); }}>×</button></header><p className="sp-status" role="status">{t.loadingAssistant}</p></aside> : null}>
      <Assistant open={panel} config={config} t={t} initialQuestion={initialQuestion} onClose={() => { setPanel(false); requestAnimationFrame(restoreFocus); }} />
    </Suspense>}
  </>;
}

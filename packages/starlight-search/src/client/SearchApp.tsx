import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ClientConfig } from '../core/types';
import { excerpt } from '../core/excerpt';
import { matchRanges } from '../core/matches';
import { translations } from './i18n';
import { preloadIndex } from './search-client';
import { useSearch } from './useSearch';
import { useDevIndex } from './useDevIndex';
import { track } from './events';
import { readSession, writeSession } from './session';
import { recentDestinations, rememberDestination } from './destinations';
import { DocumentIcon, SearchIcon, SparklesIcon } from './Icons';

const Assistant = lazy(() => import('./Assistant'));
const OPEN_KEY = 'starport:panel:v1';
interface Entry {
  id: string; url: string; title: string; breadcrumbs: string[]; text: string; terms: string[];
  section: boolean; position: number; source: 'search' | 'recent' | 'starter';
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  let end = 0;
  const parts = matchRanges(text, terms).map((range) => {
    const before = text.slice(end, range.start);
    end = range.end;
    return <span key={range.start}>{before}<mark>{text.slice(range.start, range.end)}</mark></span>;
  });
  return <>{parts}{text.slice(end)}</>;
}

export default function SearchApp({ config }: { config: ClientConfig }) {
  const [locale, setLocale] = useState('en');
  const [mac, setMac] = useState(false);
  const t = translations(locale);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<{ text: string; id: number }>();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ReturnType<typeof recentDestinations>>([]);
  const hasQuery = Boolean(query.trim());
  const { results, resultQuery, pending, showProgress, error, retry } = useSearch(config.manifestUrl, query, locale, open);
  const stale = useDevIndex(config.manifestUrl, open, config.dev);
  const recentLinks = useMemo(() => recent.filter((link) => link.locale === locale).slice(0, 4), [recent, locale]);
  const entries: Entry[] = useMemo(() => hasQuery ? results.flatMap((result, pageIndex) => [{
    id: result.id, url: result.url, title: result.title, breadcrumbs: result.breadcrumbs,
    text: result.description || result.text, terms: result.terms, section: false, position: pageIndex + 1, source: 'search' as const,
  }, ...result.sections.map((section) => ({
    id: section.id, url: section.url, title: section.heading, breadcrumbs: [],
    text: section.text, terms: section.terms, section: true, position: pageIndex + 1, source: 'search' as const,
  }))]) : (recentLinks.length ? recentLinks : config.starterLinks?.[locale] ?? config.starterLinks?.[locale.split('-')[0]] ?? []).map((link, i) => ({
    id: link.url, url: link.url, title: link.title, text: link.description || '', breadcrumbs: [], terms: [],
    section: false, position: i + 1, source: recentLinks.length ? 'recent' : 'starter',
  })), [results, hasQuery, recentLinks, config.starterLinks, locale]);
  const askOption = config.assistant && hasQuery;
  const count = entries.length + (askOption ? 1 : 0);
  const [selection, setSelection] = useState<{ entries: Entry[]; index: number }>();
  const selected = selection?.entries === entries ? Math.min(selection.index, Math.max(0, count - 1)) : 0;
  const setSelected = (index: number) => setSelection({ entries, index });
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
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    setRecent(recentDestinations());
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
    if (selected < entries.length) dialog.current?.querySelector(`#sp-result-${selected}`)?.scrollIntoView({ block: 'nearest' });
  }, [selected, entries]);

  const ask = () => {
    if (!config.assistant) return;
    // Release the native modal's focus before the assistant focuses its composer.
    dialog.current?.close();
    setOpen(false); setMounted(true); setPanel(true);
    if (query.trim()) setInitialQuestion({ text: query.trim(), id: ++requestCounter.current });
  };
  const navigate = (entry: Entry) => {
    track('search_result_click', { query: entry.source === 'search' ? resultQuery : '', url: entry.url, position: entry.position, source: entry.source });
    setRecent(rememberDestination({ url: entry.url, title: entry.title.slice(0, 200), description: excerpt(entry.text, entry.terms) }, locale));
    setOpen(false); window.location.assign(entry.url);
  };
  const askKeys = <span className="sp-key-group sp-ask-keys" aria-hidden="true"><kbd>{mac ? '⌥' : 'Alt'}</kbd><kbd>↵</kbd></span>;
  return <>
    <dialog className="sp-modal" ref={dialog} aria-label={t.search} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="sp-modal-inner">
        <div className="sp-query-row">
          <span className="sp-search-icon"><SearchIcon /></span>
          <input ref={input} value={query} maxLength={300} onChange={(event) => setQuery(event.target.value)} placeholder={t.placeholder} aria-label={t.search}
            role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="sp-results" aria-activedescendant={count ? `sp-result-${selected}` : undefined}
            autoComplete="off" spellCheck="false" data-ph-unmask onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (count) setSelected((selected + (event.key === 'ArrowDown' ? 1 : -1) + count) % count); }
              if (event.key === 'Enter') { event.preventDefault(); if (event.altKey || (askOption && selected === entries.length)) ask(); else if (entries[selected]) navigate(entries[selected]); }
            }} />
          {config.assistant && <button className="sp-ask-query" aria-label={t.ask} aria-keyshortcuts="Alt+Enter" title={t.ask} onClick={ask}><span className="sp-ask-label">{t.ask}</span>{askKeys}<span className="sp-ask-mobile-icon"><SparklesIcon /></span></button>}
          <button className="sp-icon-button sp-mobile-close" onClick={() => setOpen(false)} aria-label={t.close}>×</button>
        </div>
        <div id="sp-results" className="sp-results-layout" role="listbox" aria-label={t.search} aria-busy={hasQuery && pending}>
          <div className="sp-result-scroll">
            <div role="status" className="sp-status">{error ? (config.dev ? t.missing : t.searchError) : !hasQuery && !entries.length ? t.start : hasQuery && !pending && !entries.length ? t.noResults : ''}
              {error && <button onClick={() => { retry(); input.current?.focus(); }}>{t.retry}</button>}
            </div>
            {!hasQuery && entries.length > 0 && <div className="sp-group-label">{recentLinks.length ? t.recent : t.startHere}</div>}
            {entries.map((entry, i) => <a key={entry.id} id={`sp-result-${i}`} role="option" aria-selected={selected === i} className={`sp-result${entry.section ? ' sp-section-result' : ''}`} tabIndex={-1} href={entry.url}
              onPointerMove={() => setSelected(i)} onClick={(event) => { event.preventDefault(); navigate(entry); }}>
              <span className="sp-result-icon" aria-hidden="true">{entry.section ? '#' : <DocumentIcon />}</span>
              <span className="sp-result-content">
                <span className="sp-result-heading">
                  <span className="sp-result-title" title={entry.title}><Highlight text={entry.title} terms={entry.terms} /></span>
                  {entry.breadcrumbs.length > 0 && <span className="sp-breadcrumb">
                    <span className="sp-breadcrumb-text">{entry.breadcrumbs.length > 1 && <span className="sp-breadcrumb-ancestors">{entry.breadcrumbs.slice(0, -1).join(' › ')} › </span>}{entry.breadcrumbs.at(-1)}</span>
                    <span className="sp-breadcrumb-tooltip" aria-hidden="true">{entry.breadcrumbs.join(' › ')}</span>
                  </span>}
                </span>
                <span className="sp-excerpt"><Highlight text={excerpt(entry.text, entry.terms)} terms={entry.terms} /></span>
              </span><span className="sp-result-enter" aria-hidden="true"><kbd>↵</kbd></span>
            </a>)}
          </div>
          {askOption && <button id={`sp-result-${entries.length}`} role="option" aria-selected={selected === entries.length} className="sp-result sp-ask-result" tabIndex={-1} onPointerMove={() => setSelected(entries.length)} onClick={ask}>
            <SparklesIcon /><span className="sp-ask-result-text">{t.ask}: <strong>{query.trim()}</strong></span>{askKeys}
          </button>}
        </div>
        <footer className="sp-search-footer">
          <span className="sp-keyboard-help"><span className="sp-key-group"><kbd>↑</kbd><kbd>↓</kbd> {t.select}</span><span className="sp-key-group"><kbd>↵</kbd> {t.open}</span></span>
          <span className="sp-search-progress" role="status">{showProgress ? t.loading : ''}</span>
          {config.dev && <details className="sp-dev-indicator" data-stale={stale || error || undefined}><summary>{stale ? t.rebuildIndex : t.devIndex}</summary><span className="sp-dev-tooltip">{stale ? t.staleIndex : t.dev}</span></details>}
          <button className="sp-close-search" onClick={() => setOpen(false)}><kbd>Esc</kbd> {t.close}</button>
        </footer>
      </div>
    </dialog>
    {mounted && config.assistant && <Suspense fallback={panel ? <aside className="sp-panel" aria-label={t.assistant}><header className="sp-panel-header"><h2>✦ {t.assistant}</h2><button className="sp-icon-button" aria-label={t.closeAssistant} onClick={() => { setPanel(false); requestAnimationFrame(restoreFocus); }}>×</button></header><p className="sp-status" role="status">{t.loadingAssistant}</p></aside> : null}>
      <Assistant open={panel} config={config} t={t} initialQuestion={initialQuestion} onClose={() => { setPanel(false); requestAnimationFrame(restoreFocus); }} />
    </Suspense>}
  </>;
}

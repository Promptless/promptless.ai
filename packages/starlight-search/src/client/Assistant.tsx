import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ClientConfig } from '../core/types';
import { MAX_QUESTION_CHARS } from '../core/conversation';
import type { Labels } from './i18n';
import { track } from './events';
import { loadChat, messageText, requestHistory, saveChat, sourcesFor } from './session';
import { ChatActions } from './chat-actions';

function Activity({ message, t }: { message: UIMessage; t: Labels }) {
  return <>{message.parts.map((part, i) => {
    if (part.type !== 'tool-search' && part.type !== 'tool-readPage') return null;
    const input = part.input as { query?: string; pageId?: string } | undefined;
    const output = 'output' in part ? part.output as { title?: string; error?: string } | undefined : undefined;
    const done = part.state === 'output-available';
    const failed = part.state === 'output-error' || Boolean(output?.error);
    return <div className="sp-activity" key={i}><span aria-hidden="true">{failed ? '!' : done ? '✓' : '⌕'}</span><span>
      {failed ? t.failed : part.type === 'tool-search' ? `${done ? t.found : t.searching} “${input?.query ?? '…'}”` : `${done ? t.read : t.reading} ${output?.title || input?.pageId || '…'}`}
    </span></div>;
  })}</>;
}

export default function Assistant({ config, t, open, onClose, initialQuestion }: {
  config: ClientConfig; t: Labels; open: boolean; onClose: () => void; initialQuestion?: { text: string; id: number };
}) {
  const [saved] = useState(loadChat);
  const [actions] = useState(() => new ChatActions());
  const [interrupted, setInterrupted] = useState(saved.interrupted);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [mobile, setMobile] = useState(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const startedAt = useRef(0);
  const firstText = useRef(false);
  const lastSubmitted = useRef<number | undefined>(undefined);
  const transport = useMemo(() => new DefaultChatTransport({
    api: config.endpoint,
    prepareSendMessagesRequest: ({ messages }) => ({ body: {
      messages: requestHistory(messages), pageId: location.pathname, locale: document.documentElement.lang || 'en',
    } }),
    fetch: async (url, init) => {
      const response = await fetch(url, init);
      if (!response.ok) throw new Error(response.status === 429 ? 'RATE_LIMIT' : response.status === 503 ? 'UNAVAILABLE' : 'REQUEST_FAILED');
      return response;
    },
  }), [config.endpoint]);
  const { messages, sendMessage, regenerate, stop, status, error, setMessages, clearError } = useChat({
    messages: saved.messages, transport, throttle: 40,
    onFinish: ({ isAbort, isDisconnect, isError, finishReason }) => {
      if (actions.acceptsEvents) setInterrupted(isAbort || isDisconnect || isError || finishReason === 'length');
      if (startedAt.current) track('assistant_latency', { stage: 'complete', latency_ms: Math.round(performance.now() - startedAt.current), interrupted: isAbort || isDisconnect || isError });
    },
    onError: (error) => {
      if (!actions.acceptsEvents) return;
      setInterrupted(true); track('assistant_error', { code: error.message === 'RATE_LIMIT' ? 'rate_limit' : 'request_failed' });
    },
  });
  const busy = status === 'streaming' || status === 'submitted';

  useEffect(() => { setStorageAvailable(saveChat(messages, busy || interrupted)); }, [messages, busy, interrupted]);
  useEffect(() => {
    if (busy && !firstText.current && messages.at(-1)?.role === 'assistant' && messageText(messages.at(-1)!).trim()) {
      firstText.current = true;
      track('assistant_latency', { stage: 'first_text', latency_ms: Math.round(performance.now() - startedAt.current) });
    }
    if (atBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, busy]);
  useEffect(() => {
    const media = matchMedia('(max-width: 63.99rem)');
    const sync = () => setMobile(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const site = document.querySelector<HTMLElement>('#starport-site');
    if (site) site.inert = open && mobile;
    if (open) composer.current?.focus();
    return () => { if (site) site.inert = false; };
  }, [open, mobile]);
  useEffect(() => {
    const abort = () => { if (busy) { saveChat(messages, true); void stop(); } };
    window.addEventListener('pagehide', abort);
    return () => window.removeEventListener('pagehide', abort);
  }, [busy, messages, stop]);

  const begin = () => { setInterrupted(false); clearError(); setNotice(''); startedAt.current = performance.now(); firstText.current = false; atBottom.current = true; };
  const submit = async (question: string) => {
    if (!question.trim()) return;
    await actions.run(stop, async () => {
      begin(); setInput('');
      track('assistant_question', { question: question.trim(), question_length: question.trim().length });
      await sendMessage({ text: question.trim() });
    });
  };
  useEffect(() => {
    if (initialQuestion && initialQuestion.id !== lastSubmitted.current) {
      lastSubmitted.current = initialQuestion.id;
      void submit(initialQuestion.text);
    }
  }, [initialQuestion]);
  const retry = (messageId?: string) => actions.run(stop, async () => { begin(); await regenerate({ messageId }); });
  const reset = () => actions.run(stop, () => {
    setMessages([]); clearError(); setInterrupted(false); setFeedback({}); setNotice(''); setInput('');
    saveChat([], false); composer.current?.focus();
  });
  const cancel = () => actions.run(stop, () => { setInterrupted(true); });
  const sourceClick = (url: string) => {
    saveChat(messages, busy || interrupted); track('assistant_source_click', { url });
  };
  const errorText = error?.message === 'RATE_LIMIT' ? t.rateLimit : error?.message === 'UNAVAILABLE' ? t.unavailable : error ? t.failed : interrupted ? t.interrupted : '';

  return <aside ref={panel} hidden={!open} className="sp-panel" role={mobile ? 'dialog' : 'complementary'} aria-modal={mobile ? true : undefined} aria-label={t.assistant}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (mobile && event.key === 'Tab') {
        const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea') ?? []).filter((element) => element.offsetParent !== null);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <header className="sp-panel-header"><h2><span aria-hidden="true">✦</span> {t.assistant}</h2><div>
      <button className="sp-icon-button" onClick={() => void reset()} aria-label={t.clear}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg></button>
      <button className="sp-icon-button" onClick={onClose} aria-label={t.closeAssistant}>×</button>
    </div></header>
    <div className="sp-conversation ph-no-capture ph-mask" ref={scroll} onScroll={() => { const element = scroll.current!; atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      {!messages.length && <div className="sp-welcome"><div className="sp-welcome-star" aria-hidden="true">✦</div><h3>{t.intro}</h3><p>{t.hint}</p><button onClick={() => void submit(t.page)}>{t.page} <span aria-hidden="true">↗</span></button></div>}
      {messages.map((message, i) => message.role === 'user' ? <div className="sp-question" key={message.id}>{messageText(message)}</div> : <article className="sp-answer" key={message.id}>
        <Activity message={message} t={t} />
        <div className="sp-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
          img: () => null,
          a: ({ href, children }) => {
            const sources = sourcesFor(message);
            const allowed = href && /^\/(?!\/)/.test(href) && sources.some((source) => source.url.split('#')[0] === href.split('#')[0]);
            return allowed ? <a href={href} onClick={() => sourceClick(href)}>{children}</a> : <span>{children}</span>;
          },
        }}>{messageText(message)}</Markdown></div>
        {sourcesFor(message).length > 0 && <div className="sp-sources" aria-label={t.sources}>{sourcesFor(message).map((source) => <a key={source.url} href={source.url} onClick={() => sourceClick(source.url)}><span aria-hidden="true">↗</span> {source.title}</a>)}</div>}
        {messageText(message) && !(busy && i === messages.length - 1) && <div className="sp-answer-actions">
          <button className="sp-icon-button" aria-label={t.copy} title={t.copy} onClick={() => { void navigator.clipboard.writeText(messageText(message)).then(() => setNotice(t.copied)).catch(() => setNotice(t.copyError)); }}>⧉</button>
          <button className="sp-icon-button" aria-label={t.retry} title={t.retry} disabled={busy} onClick={() => void retry(message.id)}>↻</button>
          {(['up', 'down'] as const).map((value) => <button key={value} className="sp-icon-button" aria-label={value === 'up' ? t.helpful : t.unhelpful} title={value === 'up' ? t.helpful : t.unhelpful} aria-pressed={feedback[message.id] === value} onClick={() => {
            setFeedback((old) => ({ ...old, [message.id]: value })); setNotice(t.feedback); track('assistant_feedback', { message_id: message.id, value });
          }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={value === 'down' ? { transform: 'rotate(180deg)' } : undefined}><path d="M7 10 11 3c2 0 3 1 2 4l-1 3h6c2 0 3 1 2 3l-2 7H7zM3 10h4v10H3z" /></svg></button>)}
        </div>}
      </article>)}
      {busy && <div className="sp-pending" role="status"><span className="sp-pulse" aria-hidden="true" />{t.thinking}</div>}
      {errorText && !busy && <div className="sp-chat-error" role="status"><p>{errorText}</p><button onClick={() => void retry()}>{t.retry} ↻</button></div>}
    </div>
    <div className="sp-composer-area">
      <div className="sp-notice" role="status">{!storageAvailable ? t.storage : notice}</div>
      <form className="sp-composer" onSubmit={(event) => { event.preventDefault(); if (!busy) void submit(input); }}>
        <textarea ref={composer} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.question} aria-label={t.question} rows={2} maxLength={MAX_QUESTION_CHARS}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!busy) void submit(input); } }} />
        <div className="sp-composer-footer"><span>{config.siteTitle}</span>{busy
          ? <button type="button" className="sp-send" onClick={() => void cancel()} aria-label={t.stop} title={t.stop}>■</button>
          : <button type="submit" className="sp-send" disabled={!input.trim()} aria-label={t.send} title={t.send}>↑</button>}
        </div>
      </form>
    </div>
  </aside>;
}

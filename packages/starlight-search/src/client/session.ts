import type { UIMessage } from 'ai';
import { budgetHistory, type HistoryMessage } from '../core/conversation';

export function readSession<T>(key: string, fallback: T): T {
  try { const data = sessionStorage.getItem(key); return data && data.length < 250_000 ? JSON.parse(data) as T : fallback; }
  catch { return fallback; }
}
export function writeSession(key: string, value: unknown): boolean {
  try { sessionStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function messageText(message: UIMessage): string {
  return message.parts.filter((part) => part.type === 'text').map((part) => part.text).join('\n');
}
export function requestHistory(messages: UIMessage[]): HistoryMessage[] {
  const history: HistoryMessage[] = [];
  for (const message of messages) {
    const content = messageText(message).trim();
    if (!content) continue;
    if (message.role === 'user') {
      if (history.at(-1)?.role === 'user') history.pop();
      history.push({ role: 'user', content });
    } else if (message.role === 'assistant' && history.at(-1)?.role === 'user') history.push({ role: 'assistant', content });
  }
  return budgetHistory(history);
}
export function sourcesFor(message: UIMessage): { title: string; url: string }[] {
  const sources = message.parts.flatMap((part) => {
    if (part.type === 'source-url') return [{ title: part.title || part.url, url: part.url }];
    if (part.type === 'tool-readPage' && part.state === 'output-available') {
      const output = part.output as { title?: string; url?: string } | undefined;
      if (output?.title && output.url) return [{ title: output.title, url: output.url }];
    }
    return [];
  });
  return sources.filter((source, index) => /^\/(?!\/)/.test(source.url) && sources.findIndex((other) => other.url === source.url) === index);
}
export const CHAT_KEY = 'starport:conversation:v1';
interface SavedChat { messages: UIMessage[]; interrupted: boolean }
export function loadChat(): SavedChat {
  const saved = readSession<SavedChat>(CHAT_KEY, { messages: [], interrupted: false });
  if (!Array.isArray(saved.messages) || !saved.messages.every((m) => typeof m.id === 'string' && ['user', 'assistant'].includes(m.role) && Array.isArray(m.parts))) return { messages: [], interrupted: false };
  return saved;
}
export function saveChat(messages: UIMessage[], interrupted: boolean) {
  // Persist display text and sources, never the read tool's full page contents.
  const compact = messages.slice(-30).map((message): UIMessage => ({
    id: message.id, role: message.role,
    parts: [
      { type: 'text', text: messageText(message) },
      ...sourcesFor(message).map((source) => ({ type: 'source-url' as const, sourceId: source.url, ...source })),
    ],
  }));
  while (JSON.stringify(compact).length > 180_000 && compact.length > 2) {
    compact.shift();
    while (compact.length && compact[0].role !== 'user') compact.shift();
  }
  return writeSession(CHAT_KEY, { messages: compact, interrupted });
}

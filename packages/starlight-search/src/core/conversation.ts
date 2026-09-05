export const MAX_QUESTION_CHARS = 4_000;
export const MAX_HISTORY_CHARS = 24_000;
export const MAX_ANSWER_CHARS = 20_000;
export const MAX_REQUEST_BYTES = 128_000;
export interface HistoryMessage { role: 'user' | 'assistant'; content: string }

/** Keep whole user/assistant turns. The latest question always survives. */
export function budgetHistory(messages: HistoryMessage[]): HistoryMessage[] {
  const turns: HistoryMessage[][] = [];
  for (const message of messages) {
    if (message.role === 'user') turns.push([message]);
    else if (turns.length) turns[turns.length - 1].push(message);
  }
  let size = 0;
  let start = turns.length;
  for (let i = turns.length - 1; i >= 0; i--) {
    const next = turns[i].reduce((sum, message) => sum + message.content.length, 0);
    if (size + next > MAX_HISTORY_CHARS && start < turns.length) break;
    size += next;
    start = i;
  }
  return turns.slice(start).flat();
}

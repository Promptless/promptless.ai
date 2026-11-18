/**
 * Copy-to-clipboard buttons. Any element with `data-as-copy` copies either the
 * text in `data-as-copy-text` or the textContent/value of the element matched
 * by the selector in `data-as-copy-target`. Optional `data-as-event` (+
 * `data-as-slug`, `data-as-location`) fires a PostHog event after a copy.
 */
import { capture } from './analytics';

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback (insecure origins, old browsers).
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function sourceText(button: HTMLElement): string {
  if (button.dataset.asCopyText) return button.dataset.asCopyText;
  const selector = button.dataset.asCopyTarget;
  if (!selector) return '';
  const target = document.querySelector(selector);
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return target.value;
  return target?.textContent?.trim() ?? '';
}

export function flashCopied(button: HTMLElement, ok: boolean): void {
  const label = button.querySelector<HTMLElement>('[data-as-copy-label]');
  const original = label?.dataset.original ?? label?.textContent ?? '';
  if (label && !label.dataset.original) label.dataset.original = original;
  button.dataset.copied = ok ? 'true' : 'false';
  if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
  window.setTimeout(() => {
    delete button.dataset.copied;
    if (label) label.textContent = label.dataset.original ?? original;
  }, 1800);
}

export function wireCopyButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-as-copy]').forEach((button) => {
    if (button.dataset.asCopyWired) return;
    button.dataset.asCopyWired = 'true';
    button.addEventListener('click', async () => {
      const ok = await copyText(sourceText(button));
      flashCopied(button, ok);
      if (ok && button.dataset.asEvent) {
        capture(button.dataset.asEvent, {
          slug: button.dataset.asSlug ?? '',
          location: button.dataset.asLocation ?? 'agent_score',
        });
      }
    });
  });
}

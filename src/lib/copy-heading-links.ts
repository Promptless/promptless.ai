const copyStatus = document.createElement('span');
copyStatus.className = 'sr-only';
copyStatus.setAttribute('role', 'status');
document.body.append(copyStatus);

const headingLinks = document.querySelectorAll<HTMLAnchorElement>('.sl-heading-wrapper > .sl-anchor-link');
for (const link of headingLinks) {
  const heading = link.previousElementSibling?.textContent?.trim();
  if (heading) link.setAttribute('aria-label', `Copy link to ${heading}`);
}

document.addEventListener('click', async (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest<HTMLAnchorElement>('.sl-heading-wrapper > .sl-anchor-link');
  if (!link) return;

  let copied = false;
  try {
    await navigator.clipboard.writeText(link.href);
    copied = true;
  } catch {
    const input = document.createElement('input');
    input.value = link.href;
    document.body.append(input);
    input.select();
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      input.remove();
    }
  }

  if (copied) {
    link.dataset.copyStatus = 'Copied';
    copyStatus.textContent = 'Section link copied to clipboard.';
    window.setTimeout(() => {
      delete link.dataset.copyStatus;
      copyStatus.textContent = '';
    }, 2000);
  } else {
    copyStatus.textContent = 'Could not copy the section link.';
  }
});

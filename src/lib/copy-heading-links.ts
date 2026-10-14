document.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest<HTMLAnchorElement>('.sl-heading-wrapper > .sl-anchor-link');
  if (!link) return;

  void navigator.clipboard.writeText(link.href).catch((error: unknown) => {
    console.error('Could not copy section link', error);
  });
});

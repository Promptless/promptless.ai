export type DocsProductId = 'for_docs' | 'agent_instructions';

export type DocsProductIcon = 'docs' | 'agent_instructions';

export interface DocsProduct {
  id: DocsProductId;
  label: string;
  switcherLabel?: string;
  href: string;
  description: string;
  icon: DocsProductIcon;
  badge?: string;
  pathPrefix: string;
}

export const DOCS_PRODUCTS: readonly DocsProduct[] = [
  {
    id: 'for_docs',
    label: 'Promptless for Docs',
    href: '/docs/for-docs/start-here/welcome',
    description: 'Keep customer-facing documentation current.',
    icon: 'docs',
    pathPrefix: '/docs/for-docs',
  },
  {
    id: 'agent_instructions',
    label: 'Promptless for Agent Instructions',
    switcherLabel: 'for Agent Instructions',
    href: '/docs/governance',
    description: 'Govern and improve your AI workforce.',
    icon: 'agent_instructions',
    badge: 'New',
    pathPrefix: '/docs/governance',
  },
];

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getActiveDocsProduct(pathname: string): DocsProduct | undefined {
  const normalized = normalizePathname(pathname);
  return DOCS_PRODUCTS.find(
    (product) => normalized === product.pathPrefix || normalized.startsWith(`${product.pathPrefix}/`),
  );
}

export type SiteSection = 'website' | 'pricing' | 'docs' | 'blog' | 'changelog' | 'free_tools' | 'jobs' | 'wtd' | 'none';
export type TopNavIcon = 'website' | 'pricing' | 'docs' | 'blog' | 'changelog' | 'free_tools' | 'jobs' | 'wtd';

interface TopNavBaseItem {
  section: SiteSection;
  label: string;
  icon?: TopNavIcon;
}

export interface TopNavLinkItem extends TopNavBaseItem {
  href: string;
  external?: boolean;
}

export type TopNavItem = TopNavLinkItem;

export const TOP_NAV_ITEMS: TopNavItem[] = [
  { section: 'website', href: '/', label: 'Home', icon: 'website' },
  { section: 'pricing', href: '/pricing', label: 'Pricing', icon: 'pricing' },
  { section: 'docs', href: '/docs', label: 'Docs', icon: 'docs' },
  { section: 'blog', href: '/blog', label: 'Blog', icon: 'blog' },
  { section: 'changelog', href: '/changelog', label: 'Changelog', icon: 'changelog' },
  { section: 'free_tools', href: '/free-tools', label: 'Free tools', icon: 'free_tools' },
  { section: 'wtd', href: '/wtd-portland-2026', label: 'WTD 2026', icon: 'wtd' },
];

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getActiveSection(pathname: string): SiteSection {
  const normalized = normalizePathname(pathname);
  if (
    normalized === '/' ||
    normalized === '/home' ||
    normalized.startsWith('/site')
  ) {
    return 'website';
  }
  if (normalized === '/pricing') return 'pricing';
  if (normalized === '/jobs') return 'jobs';
  if (normalized === '/wtd-portland-2026') return 'wtd';
  if (normalized.startsWith('/docs')) return 'docs';
  if (normalized.startsWith('/blog')) return 'blog';
  if (normalized.startsWith('/changelog')) return 'changelog';
  if (normalized.startsWith('/free-tools')) return 'free_tools';
  if (normalized === '/meet') return 'none';
  return 'website';
}

export type WebsitePageId = 'home' | 'pricing' | 'jobs' | 'wtd-portland-2026';

export interface WebsiteNavItem {
  id: WebsitePageId;
  href: string;
  label: string;
  icon: 'overview' | 'pricing' | 'jobs' | 'calendar';
}

interface WebsiteSidebarLink {
  label: string;
  link: string;
  attrs?: Record<string, string>;
}

export const WEBSITE_NAV_ITEMS: WebsiteNavItem[] = [
  { id: 'home', href: '/', label: 'Overview', icon: 'overview' },
  { id: 'pricing', href: '/pricing', label: 'Pricing', icon: 'pricing' },
  { id: 'jobs', href: '/jobs', label: 'Work at Promptless!', icon: 'jobs' },
  { id: 'wtd-portland-2026', href: '/wtd-portland-2026', label: 'WTD 2026', icon: 'calendar' },
];

export function getWebsiteSidebarLinks(): WebsiteSidebarLink[] {
  return WEBSITE_NAV_ITEMS.map((item) => ({
    label: item.label,
    link: item.href,
    attrs: {
      'data-website-sidebar': 'true',
      'data-site-icon': item.icon,
    },
  }));
}

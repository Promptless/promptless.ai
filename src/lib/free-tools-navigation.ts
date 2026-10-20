export type FreeToolPageId = 'overview' | 'agent_score' | 'broken_link_report';

export interface FreeToolNavItem {
  id: FreeToolPageId;
  href: string;
  label: string;
}

interface FreeToolsSidebarLink {
  label: string;
  link: string;
}

export const FREE_TOOLS_NAV_ITEMS: FreeToolNavItem[] = [
  { id: 'overview', href: '/free-tools', label: 'Overview' },
  { id: 'agent_score', href: '/agent-score', label: 'Agent Score' },
  { id: 'broken_link_report', href: '/free-tools/broken-link-report', label: 'Broken Link Report' },
];

export function getFreeToolsSidebarLinks(): FreeToolsSidebarLink[] {
  return FREE_TOOLS_NAV_ITEMS.map((item) => ({
    label: item.label,
    link: item.href,
  }));
}

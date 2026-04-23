export type PricingPlanId = 'startup' | 'growth' | 'enterprise';

export interface GrowthBundleOption {
  id: string;
  label: string;
  priceLabel: string;
}

export interface PricingPlanConfig {
  id: PricingPlanId;
  title: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  ctaAction: string;
}

export interface CompareRow {
  feature: string;
  startup: string;
  growth: string;
  enterprise: string;
}

export const STARTUP_MONTHLY_USD = 500;
export const STARTUP_DOC_UNITS = 200;

export const STARTUP_PLAN: PricingPlanConfig = {
  id: 'startup',
  title: 'Startup',
  summary: 'For teams with small docs sites and standard integration needs.',
  ctaLabel: 'Sign up',
  ctaHref: 'https://accounts.gopromptless.ai/sign-up',
  ctaAction: 'sign_up',
};

export const GROWTH_PLAN: PricingPlanConfig = {
  id: 'growth',
  title: 'Growth',
  summary: 'For teams with larger docs sites and broader integrations.',
  ctaLabel: 'Book demo',
  ctaHref: 'https://cal.com/team/promptless/15m-discovery-call',
  ctaAction: 'book_demo',
};

export const ENTERPRISE_PLAN: PricingPlanConfig = {
  id: 'enterprise',
  title: 'Enterprise',
  summary: 'For teams with massive docs sites or advanced governance needs.',
  ctaLabel: 'Book demo',
  ctaHref: 'https://cal.com/team/promptless/15m-discovery-call',
  ctaAction: 'book_demo',
};

export const GROWTH_BUNDLE_OPTIONS: GrowthBundleOption[] = [
  {
    id: 'growth-200-500',
    label: '200-500 Pages',
    priceLabel: '$500-$1,000/mo',
  },
  {
    id: 'growth-500-1000',
    label: '500-1,000 Pages',
    priceLabel: '$1,000-$1,500/mo',
  },
  {
    id: 'growth-1000-2000',
    label: '1,000-2,000 Pages',
    priceLabel: '$1,500-$2,000/mo',
  },
  {
    id: 'growth-2000-5000',
    label: '2,000-5,000 Pages',
    priceLabel: '$2,000-$4,000/mo',
  },
];

export const STARTUP_FEATURES = [
  '14 day free trial',
  'Slack + GitHub integrations',
  'Unlimited contributors',
  'Unlimited triggers',
  'Unlimited documentation updates',
  'Slack Connect support channel',
];

export const GROWTH_FEATURES = [
  'Expanded integrations (Linear, Jira, Confluence, Notion, and more)',
  'Promptless-generated translations',
  'Screenshot updates via Promptless Capture',
  'Advanced workflow automation controls',
];

export const ENTERPRISE_FEATURES = [
  'Custom integrations',
  'Audit logs and governance controls',
  'Data retention controls',
  'Secure connectivity options',
  'Dedicated onboarding support',
];

export const COMPARE_ROWS: CompareRow[] = [
  {
    feature: 'Included Pages* (monthly)',
    startup: '200',
    growth: '400-1,000 (select bundle)',
    enterprise: 'Custom volume',
  },
  {
    feature: 'Integrations',
    startup: 'Slack + GitHub',
    growth: 'Standard integration set',
    enterprise: 'All standard + custom/private integrations',
  },
  {
    feature: 'Processing cadence',
    startup: 'Standard',
    growth: 'Priority',
    enterprise: 'Dedicated capacity',
  },
  {
    feature: 'SSO / SAML',
    startup: 'No',
    growth: 'No',
    enterprise: 'Yes',
  },
  {
    feature: 'Advanced RBAC',
    startup: 'No',
    growth: 'No',
    enterprise: 'Yes',
  },
  {
    feature: 'Audit logs/export',
    startup: 'No',
    growth: 'No',
    enterprise: 'Yes',
  },
  {
    feature: 'Data retention controls',
    startup: 'No',
    growth: 'No',
    enterprise: 'Yes',
  },
  {
    feature: 'Private networking options',
    startup: 'No',
    growth: 'No',
    enterprise: 'Yes',
  },
];

export function formatMonthlyUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPages(value: number): string {
  return `${new Intl.NumberFormat('en-US').format(value)} Pages*`;
}

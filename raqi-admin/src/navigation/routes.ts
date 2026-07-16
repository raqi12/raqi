import { TAB_LABELS } from '../i18n/ar';

export type SidebarTab = keyof typeof TAB_LABELS;

export const ROUTE_PATHS: Record<SidebarTab, string> = {
  overview: '/overview',
  users: '/users',
  customers: '/customers',
  drivers: '/drivers',
  plans: '/plans',
  bins: '/bins',
  locations: '/locations',
  routes: '/routes',
  tasks: '/tasks',
  subscriptions: '/subscriptions',
  payments: '/payments',
  'bank-account': '/bank-account',
  'deposit-requests': '/deposit-requests',
  complaints: '/complaints',
  tickets: '/tickets',
  support: '/support',
  notifications: '/notifications',
  'send-notification': '/notifications/send',
};

const pathToTab = new Map(Object.entries(ROUTE_PATHS).map(([tab, path]) => [path, tab as SidebarTab]));

export function tabFromPathname(pathname: string): SidebarTab {
  const normalized = pathname.replace(/\/+$/, '') || '/overview';
  if (normalized === '/' || normalized === '') {
    return 'overview';
  }
  if (normalized.startsWith('/notifications/send')) {
    return 'send-notification';
  }
  if (normalized.startsWith('/notifications')) {
    return 'notifications';
  }
  return pathToTab.get(normalized) ?? 'overview';
}

const TAB_NAV_GROUPS: Record<SidebarTab, string> = {
  overview: 'رئيسي',
  customers: 'العمليات',
  subscriptions: 'العمليات',
  tasks: 'العمليات',
  complaints: 'العمليات',
  tickets: 'العمليات',
  notifications: 'العمليات',
  'send-notification': 'العمليات',
  support: 'العمليات',
  users: 'الموارد',
  drivers: 'الموارد',
  plans: 'الموارد',
  bins: 'الموارد',
  locations: 'الموارد',
  routes: 'الموارد',
  payments: 'المالية',
  'bank-account': 'المالية',
  'deposit-requests': 'المالية',
};

export function getNavGroupLabel(tab: SidebarTab): string {
  return TAB_NAV_GROUPS[tab];
}

export const ADMIN_ROUTE_PATHS = Object.values(ROUTE_PATHS);

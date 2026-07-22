import { TAB_LABELS } from '../i18n/ar';

export type SidebarTab = keyof typeof TAB_LABELS;

export const ROUTE_PATHS: Record<SidebarTab, string> = {
  overview: '/overview',
  managers: '/managers',
  customers: '/customers',
  drivers: '/drivers',
  plans: '/plans',
  bins: '/bins',
  locations: '/locations',
  tasks: '/tasks',
  subscriptions: '/subscriptions',
  payments: '/payments',
  'bank-account': '/bank-account',
  'additional-collection': '/additional-collection',
  'deposit-requests': '/deposit-requests',
  'cash-topups': '/cash-topups',
  complaints: '/complaints',
  tickets: '/tickets',
  support: '/support',
  gallery: '/gallery',
  privacy: '/privacy',
  instructions: '/instructions',
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
  if (normalized.startsWith('/customers')) {
    return 'customers';
  }
  if (normalized.startsWith('/subscriptions')) {
    return 'subscriptions';
  }
  if (normalized.startsWith('/gallery')) {
    return 'gallery';
  }
  if (normalized.startsWith('/tickets')) {
    return 'tickets';
  }
  if (normalized.startsWith('/managers') || normalized.startsWith('/users')) {
    return 'managers';
  }
  if (normalized.startsWith('/drivers')) {
    return 'drivers';
  }
  if (normalized.startsWith('/plans')) {
    return 'plans';
  }
  if (normalized.startsWith('/bins')) {
    return 'bins';
  }
  if (normalized.startsWith('/locations') || normalized.startsWith('/areas')) {
    return 'locations';
  }
  if (normalized.startsWith('/complaints')) {
    return 'complaints';
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
  gallery: 'العمليات',
  privacy: 'العمليات',
  instructions: 'العمليات',
  managers: 'الموارد',
  drivers: 'الموارد',
  plans: 'الموارد',
  bins: 'الموارد',
  locations: 'الموارد',
  payments: 'المالية',
  'bank-account': 'المالية',
  'additional-collection': 'المالية',
  'deposit-requests': 'المالية',
  'cash-topups': 'المالية',
};

export function getNavGroupLabel(tab: SidebarTab): string {
  return TAB_NAV_GROUPS[tab];
}

export const ADMIN_ROUTE_PATHS = Object.values(ROUTE_PATHS);

import { TAB_LABELS } from '../i18n/ar';

export type SidebarTab = keyof typeof TAB_LABELS;

export const ROUTE_PATHS: Record<SidebarTab, string> = {
  overview: '/overview',
  users: '/users',
  customers: '/customers',
  drivers: '/drivers',
  plans: '/plans',
  bins: '/bins',
  areas: '/areas',
  routes: '/routes',
  tasks: '/tasks',
  subscriptions: '/subscriptions',
  payments: '/payments',
  'bank-account': '/bank-account',
  'deposit-requests': '/deposit-requests',
  complaints: '/complaints',
};

const pathToTab = new Map(Object.entries(ROUTE_PATHS).map(([tab, path]) => [path, tab as SidebarTab]));

export function tabFromPathname(pathname: string): SidebarTab {
  const normalized = pathname.replace(/\/+$/, '') || '/overview';
  if (normalized === '/' || normalized === '') {
    return 'overview';
  }
  return pathToTab.get(normalized) ?? 'overview';
}

export const ADMIN_ROUTE_PATHS = Object.values(ROUTE_PATHS);

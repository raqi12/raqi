/** Dashboard page keys a supervisor/manager may be granted. */
export const DASHBOARD_PAGE_PERMISSIONS = [
  'overview',
  'customers',
  'subscriptions',
  'tasks',
  'tickets',
  'notifications',
  'send-notification',
  'support',
  'privacy',
  'instructions',
  'gallery',
  'complaints',
  'managers',
  'drivers',
  'plans',
  'bins',
  'locations',
  'routes',
  'payments',
  'bank-account',
  'additional-collection',
  'deposit-requests',
  'cash-topups',
] as const;

export type DashboardPagePermission =
  (typeof DASHBOARD_PAGE_PERMISSIONS)[number];

export function isDashboardPagePermission(
  value: string,
): value is DashboardPagePermission {
  return (DASHBOARD_PAGE_PERMISSIONS as readonly string[]).includes(value);
}

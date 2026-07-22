import type { SidebarTab } from '../../navigation/routes';

/** Dashboard pages that can be assigned as permissions. */
export const DASHBOARD_PERMISSIONS: Array<{
  id: SidebarTab;
  label: string;
  group: string;
}> = [
  { id: 'overview', label: 'نظرة عامة', group: 'رئيسي' },
  { id: 'customers', label: 'العملاء', group: 'العمليات' },
  { id: 'subscriptions', label: 'الاشتراكات', group: 'العمليات' },
  { id: 'tasks', label: 'المهام', group: 'العمليات' },
  { id: 'tickets', label: 'تذاكر الدعم', group: 'العمليات' },
  { id: 'notifications', label: 'الإشعارات', group: 'العمليات' },
  { id: 'send-notification', label: 'إرسال إشعار', group: 'العمليات' },
  { id: 'support', label: 'صفحة الدعم', group: 'العمليات' },
  { id: 'privacy', label: 'سياسة الخصوصية', group: 'العمليات' },
  { id: 'instructions', label: 'تعليمات الاستخدام', group: 'العمليات' },
  { id: 'gallery', label: 'معرض الصور', group: 'العمليات' },
  { id: 'complaints', label: 'الشكاوى', group: 'العمليات' },
  { id: 'managers', label: 'المدراء والمشرفون', group: 'الموارد' },
  { id: 'drivers', label: 'السائقون', group: 'الموارد' },
  { id: 'plans', label: 'الخطط', group: 'الموارد' },
  { id: 'bins', label: 'الصناديق', group: 'الموارد' },
  { id: 'locations', label: 'المدن والمناطق', group: 'الموارد' },
  { id: 'payments', label: 'المدفوعات', group: 'المالية' },
  { id: 'bank-account', label: 'الحساب البنكي', group: 'المالية' },
  { id: 'additional-collection', label: 'الجمع الإضافي', group: 'المالية' },
  { id: 'deposit-requests', label: 'طلبات الإيداع', group: 'المالية' },
  { id: 'cash-topups', label: 'شحن نقدي بالمندوب', group: 'المالية' },
];

export const STAFF_ROLES: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  supervisor: 'مشرف',
};

export function permissionLabel(id: string) {
  return DASHBOARD_PERMISSIONS.find((item) => item.id === id)?.label ?? id;
}

export function canAccessTab(
  role: string | undefined,
  permissions: string[] | undefined,
  tab: SidebarTab,
): boolean {
  if (role === 'admin') return true;
  if (role === 'manager' || role === 'supervisor') {
    const granted = permissions ?? [];
    if (granted.length === 0) {
      // Managers without explicit grants still see overview + managers page
      return tab === 'overview' || (role === 'manager' && tab === 'managers');
    }
    return granted.includes(tab);
  }
  return false;
}

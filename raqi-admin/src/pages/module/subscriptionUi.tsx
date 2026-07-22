import type { ReactNode } from 'react';
import type { Driver, Subscription, Task, User } from '../../types';
import { getId, userNameById } from './shared';

export const PLAN_FREQUENCY: Record<string, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  custom: 'مخصص',
};

export type PendingSubscriptionAction = 'activate' | 'suspend' | 'renew';

export function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-LY');
}

export function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '—';
}

export function driverNameById(drivers: Driver[], users: User[], driverId?: string) {
  if (!driverId) return '—';
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  const name = userNameById(users, driver.userId);
  return driver.vehicleNumber ? `${name} (${driver.vehicleNumber})` : name;
}

export function displayOrMissing(value?: string | null, missing = 'غير محدد') {
  return value && value !== '—' ? value : missing;
}

export function subscriptionActivationReadiness(subscription: Subscription) {
  return {
    plan: Boolean(subscription.planId),
    address: Boolean(subscription.addressId && subscription.cityId && subscription.areaId),
    payment: subscription.paymentStatus === 'paid',
  };
}

export function RecordList({ empty, children }: { empty: string; children: ReactNode }) {
  if (!children) {
    return <p className="detail-block__muted">{empty}</p>;
  }
  return <ul className="record-list">{children}</ul>;
}

export const CONFIRM_COPY: Record<
  PendingSubscriptionAction,
  { title: string; description: string }
> = {
  activate: {
    title: 'تفعيل الاشتراك',
    description: 'هل تريد تفعيل هذا الاشتراك؟ يجب أن تكون الخطة والعنوان والصندوق والدفع مكتملة.',
  },
  suspend: {
    title: 'إيقاف الاشتراك',
    description: 'هل تريد إيقاف هذا الاشتراك مؤقتًا؟',
  },
  renew: {
    title: 'تجديد الاشتراك',
    description: 'هل تريد تجديد هذا الاشتراك للفترة التالية؟',
  },
};

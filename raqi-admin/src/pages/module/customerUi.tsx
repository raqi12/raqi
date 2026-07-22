import type { ReactNode } from 'react';
import type { Driver, Task, User } from '../../types';
import { getId, userNameById } from './shared';

export function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
}

export const WALLET_TRANSACTION_LABELS: Record<string, string> = {
  deposit: 'إيداع',
  admin_credit: 'إضافة إدارية',
  subscription_payment: 'دفع اشتراك',
  refund: 'استرداد',
};

export function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

export function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '—';
}

export function driverNameById(drivers: Driver[], users: User[], driverId?: string) {
  if (!driverId) return '—';
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  return userNameById(users, driver.userId);
}

export function RecordList({
  empty,
  children,
}: {
  empty: string;
  children: ReactNode;
}) {
  if (!children) {
    return <p className="detail-block__muted">{empty}</p>;
  }
  return <ul className="record-list">{children}</ul>;
}

import type { Bin, Customer, User } from '../../types';
import { customerDisplayName, getId } from './shared';

export function formatBinFee(fee?: number) {
  if (fee == null) return '0 د.ل';
  return `${fee.toLocaleString('ar-LY')} د.ل`;
}

export function formatBinCapacity(capacity?: number) {
  if (capacity == null) return '—';
  return `${capacity} لتر`;
}

export function binStock(bin: Bin) {
  const total = bin.totalCount ?? 0;
  const available = bin.availableCount ?? 0;
  const assigned = Math.max(0, total - available);
  return { total, available, assigned };
}

export function binActiveKey(bin: Bin) {
  return bin.active !== false ? 'active' : 'inactive';
}

export function customerOptionLabel(customer: Customer, users: User[]) {
  return customerDisplayName(customer, users);
}

export function customerNameById(
  customers: Customer[],
  users: User[],
  customerId?: string | null,
) {
  if (!customerId) return '—';
  const customer = customers.find((item) => getId(item) === customerId);
  if (!customer) return '—';
  return customerOptionLabel(customer, users);
}

import { formatStatus } from '../../i18n/ar';

export const COMPLAINT_STATUS_OPTIONS: Array<{
  value: 'open' | 'in_progress' | 'resolved' | 'closed';
  label: string;
}> = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلقة' },
];

export function complaintStatusLabel(status?: string) {
  if (!status) return '—';
  return (
    COMPLAINT_STATUS_OPTIONS.find((opt) => opt.value === status)?.label ??
    formatStatus(status)
  );
}

import { formatStatus } from '../../i18n/ar';

type StatusBadgeProps = {
  status?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

const toneMap: Record<string, StatusBadgeProps['tone']> = {
  active: 'success',
  approved: 'success',
  available: 'success',
  closed: 'default',
  inactive: 'default',
  pending: 'warning',
  open: 'warning',
  suspended: 'warning',
  rejected: 'danger',
};

export function StatusBadge({ status, tone }: StatusBadgeProps) {
  if (!status) return <span className="muted">—</span>;
  const resolvedTone = tone ?? toneMap[status] ?? 'default';
  return <span className={`status-badge status-badge--${resolvedTone}`}>{formatStatus(status)}</span>;
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Ticket, User } from '../../types';
import { getId, userNameById } from './shared';

type TicketsPageProps = {
  tickets: Ticket[];
  users: User[];
  loading?: boolean;
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلقة',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

export function TicketsPage({ tickets, users, loading = false }: TicketsPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      tickets.map((ticket) => {
        const owner = users.find((u) => getId(u) === ticket.userId);
        const isDriver = owner?.role === 'driver';
        return {
          ...ticket,
          customerName: ticket.userName ?? userNameById(users, ticket.userId),
          ownerTypeLabel: isDriver ? 'سائق' : 'عميل',
          assigneeName: ticket.assigneeId
            ? userNameById(users, ticket.assigneeId)
            : '—',
          priorityLabel: PRIORITY_LABELS[ticket.priority ?? 'medium'] ?? ticket.priority,
          statusLabel: STATUS_LABELS[ticket.status ?? 'pending'] ?? ticket.status,
          lastMessageLabel: formatDateTime(ticket.lastMessageAt),
        };
      }),
    [tickets, users],
  );

  const openCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'pending' || t.status === 'in_progress',
  ).length;
  const urgentCount = tickets.filter(
    (t) =>
      t.priority === 'urgent' &&
      t.status !== 'closed' &&
      t.status !== 'resolved',
  ).length;
  const unassignedCount = tickets.filter(
    (t) =>
      !t.assigneeId &&
      t.status !== 'closed' &&
      t.status !== 'resolved',
  ).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">تذاكر الدعم</h2>
          <p className="page-header__description">
            متابعة طلبات الدعم والمحادثة مع العملاء والسائقين
          </p>
        </div>
      </header>

      <div className="customers-stats customers-stats--4">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{tickets.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">مفتوحة</span>
          <strong className="customers-stat__value">{openCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">عاجلة</span>
          <strong className="customers-stat__value">{urgentCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">بدون مسؤول</span>
          <strong className="customers-stat__value">{unassignedCount}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة التذاكر"
        description="اضغط على تذكرة لفتح صفحة المحادثة"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/tickets/${getId(row)}`)}
        searchKeys={[
          'ticketNumber',
          'customerName',
          'ownerTypeLabel',
          'subject',
          'status',
          'statusLabel',
          'priorityLabel',
          'assigneeName',
        ]}
        columns={[
          { key: 'ticketNumber', label: 'رقم التذكرة' },
          { key: 'customerName', label: 'الاسم' },
          { key: 'ownerTypeLabel', label: 'النوع' },
          { key: 'subject', label: 'الموضوع' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
          {
            key: 'priorityLabel',
            label: 'الأولوية',
            render: (row) => <StatusBadge status={String(row.priority)} />,
            sortable: false,
          },
          { key: 'assigneeName', label: 'المسؤول' },
          { key: 'lastMessageLabel', label: 'آخر رسالة' },
          {
            key: 'actions',
            label: COMMON.actions,
            sortable: false,
            render: (row) => (
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tickets/${getId(row)}`);
                }}
              >
                فتح المحادثة
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

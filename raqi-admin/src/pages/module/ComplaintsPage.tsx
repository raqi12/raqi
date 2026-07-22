import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Complaint, Customer, User } from '../../types';
import { customerDisplayName, getId, userNameById } from './shared';
import { complaintStatusLabel } from './complaintUi';

type ComplaintsPageProps = {
  complaints: Complaint[];
  customers: Customer[];
  users: User[];
  loading?: boolean;
};

export function ComplaintsPage({
  complaints,
  customers,
  users,
  loading = false,
}: ComplaintsPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      complaints.map((complaint) => {
        const customer = customers.find((c) => getId(c) === complaint.customerId);
        return {
          ...complaint,
          id: getId(complaint),
          customerName: customer
            ? customerDisplayName(customer, users)
            : complaint.customerId
              ? '—'
              : '—',
          statusLabel: complaintStatusLabel(complaint.status),
          assigneeName: complaint.assignee
            ? userNameById(users, complaint.assignee)
            : 'غير معيّن',
        };
      }),
    [complaints, customers, users],
  );

  const openCount = complaints.filter(
    (c) => c.status === 'open' || c.status === 'in_progress',
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const unassignedCount = complaints.filter(
    (c) =>
      !c.assignee &&
      c.status !== 'closed' &&
      c.status !== 'resolved',
  ).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">الشكاوى</h2>
          <p className="page-header__description">
            متابعة شكاوى العملاء وتحديث حالتها وتعيين المسؤول
          </p>
        </div>
      </header>

      <div className="customers-stats customers-stats--4">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{complaints.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">مفتوحة</span>
          <strong className="customers-stat__value">{openCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">تم الحل</span>
          <strong className="customers-stat__value">{resolvedCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">بدون مسؤول</span>
          <strong className="customers-stat__value">{unassignedCount}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة الشكاوى"
        description="اضغط على صف لفتح التفاصيل وتحديث الحالة"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/complaints/${getId(row)}`)}
        searchKeys={['subject', 'customerName', 'statusLabel', 'assigneeName']}
        columns={[
          { key: 'subject', label: 'الموضوع' },
          { key: 'customerName', label: 'العميل' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status ?? 'open')} />,
            sortable: false,
          },
          { key: 'assigneeName', label: 'المسؤول' },
        ]}
      />
    </div>
  );
}

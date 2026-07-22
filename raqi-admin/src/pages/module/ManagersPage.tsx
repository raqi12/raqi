import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { User } from '../../types';
import { getId } from './shared';
import { STAFF_ROLES, permissionLabel } from './dashboardPermissions';

type ManagersPageProps = {
  users: User[];
  loading?: boolean;
};

export function ManagersPage({ users, loading = false }: ManagersPageProps) {
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        roleLabel: STAFF_ROLES[String(user.role)] ?? String(user.role ?? '—'),
        permissionsLabel:
          user.role === 'admin'
            ? 'كل الصفحات'
            : (user.permissions ?? []).length
              ? (user.permissions ?? []).map(permissionLabel).join('، ')
              : 'لا توجد صلاحيات',
        permissionsCount:
          user.role === 'admin' ? 'الكل' : String((user.permissions ?? []).length),
      })),
    [users],
  );

  const managersCount = users.filter((u) => u.role === 'manager').length;
  const supervisorsCount = users.filter((u) => u.role === 'supervisor').length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">المدراء والمشرفون</h2>
          <p className="page-header__description">
            المدراء يديرون المشرفين، وكل مشرف مسؤول عن صفحات محددة في لوحة التحكم
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/managers/new')}>
          إضافة حساب
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{users.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">مدراء</span>
          <strong className="customers-stat__value">{managersCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">مشرفون</span>
          <strong className="customers-stat__value">{supervisorsCount}</strong>
        </div>
      </div>

      <DataTable
        title="الحسابات"
        description="اضغط على صف لإدارة الصلاحيات والحالة"
        rows={rows}
        loading={loading}
        onSelect={(row) => navigate(`/managers/${getId(row)}`)}
        searchKeys={['name', 'email', 'roleLabel', 'permissionsLabel', 'status']}
        columns={[
          { key: 'name', label: COMMON.name },
          {
            key: 'email',
            label: COMMON.email,
            render: (row) => <span dir="ltr">{String(row.email ?? '—')}</span>,
          },
          { key: 'roleLabel', label: COMMON.role },
          { key: 'permissionsCount', label: 'الصفحات' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status ?? 'active')} />,
            sortable: false,
          },
        ]}
      />
    </div>
  );
}

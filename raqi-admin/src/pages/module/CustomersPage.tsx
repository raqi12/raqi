import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Customer, User } from '../../types';
import {
  areaNameById,
  cityNameById,
  customerDisplayName,
  getId,
} from './shared';

type CustomersPageProps = {
  customers: Customer[];
  users: User[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
};

export function CustomersPage({
  customers,
  users,
  cities,
  areas,
  loading = false,
}: CustomersPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        customerName: customerDisplayName(customer, users),
        email: customer.email ?? '—',
        phone: customer.phone ?? '—',
        cityName: cityNameById(cities, customer.cityId),
        areaName: areaNameById(areas, customer.areaId),
      })),
    [areas, cities, customers, users],
  );

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">العملاء</h2>
          <p className="page-header__description">
            إدارة حسابات العملاء وعناوينهم ومحافظهم واشتراكاتهم
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/customers/new')}>
          إضافة عميل
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{customers.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">
            {customers.filter((c) => (c.status ?? 'active') === 'active').length}
          </strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">معطّل</span>
          <strong className="customers-stat__value">
            {customers.filter((c) => c.status === 'inactive').length}
          </strong>
        </div>
      </div>

      <DataTable
        title="قائمة العملاء"
        description="اضغط على صف لفتح صفحة التفاصيل"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/customers/${getId(row)}`)}
        searchKeys={['customerName', 'email', 'phone', 'cityName', 'areaName', 'status']}
        columns={[
          { key: 'customerName', label: COMMON.name },
          {
            key: 'phone',
            label: COMMON.phone,
            render: (row) => (
              <span dir="ltr">{row.phone ? String(row.phone) : '—'}</span>
            ),
          },
          {
            key: 'email',
            label: COMMON.email,
            render: (row) => <span dir="ltr">{String(row.email ?? '—')}</span>,
          },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
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

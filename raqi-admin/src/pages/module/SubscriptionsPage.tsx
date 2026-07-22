import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type {
  Area,
  Bin,
  City,
  Customer,
  Driver,
  Plan,
  Subscription,
  User,
} from '../../types';
import {
  areaNameById,
  binCodeById,
  cityNameById,
  customerDisplayName,
  getId,
  planNameById,
} from './shared';
import { driverNameById } from './subscriptionUi';

type SubscriptionsPageProps = {
  subscriptions: Subscription[];
  plans: Plan[];
  bins: Bin[];
  customers: Customer[];
  users: User[];
  drivers: Driver[];
  areas: Area[];
  cities: City[];
  loading?: boolean;
};

export function SubscriptionsPage({
  subscriptions,
  plans,
  bins,
  customers,
  users,
  drivers,
  areas,
  cities,
  loading = false,
}: SubscriptionsPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      subscriptions.map((subscription) => {
        const customer = customers.find((item) => getId(item) === subscription.customerId);
        return {
          ...subscription,
          customerName: customer ? customerDisplayName(customer, users) : '—',
          planName: planNameById(plans, subscription.planId),
          binCode: binCodeById(bins, subscription.binId),
          cityName: cityNameById(cities, subscription.cityId),
          areaName: areaNameById(areas, subscription.areaId),
          driverName: driverNameById(drivers, users, subscription.driverId),
        };
      }),
    [areas, bins, cities, customers, drivers, plans, subscriptions, users],
  );

  const activeCount = subscriptions.filter((item) => item.status === 'active').length;
  const unpaidCount = subscriptions.filter((item) => item.paymentStatus !== 'paid').length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">الاشتراكات</h2>
          <p className="page-header__description">
            متابعة اشتراكات العملاء وحالات الدفع والتفعيل وتعيين السائقين
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/subscriptions/new')}>
          إنشاء اشتراك
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{subscriptions.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">غير مدفوع</span>
          <strong className="customers-stat__value">{unpaidCount}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة الاشتراكات"
        description="اضغط على صف لفتح صفحة التفاصيل"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/subscriptions/${getId(row)}`)}
        searchKeys={[
          'customerName',
          'planName',
          'cityName',
          'areaName',
          'driverName',
          'status',
          'paymentStatus',
        ]}
        columns={[
          { key: 'customerName', label: 'العميل' },
          { key: 'planName', label: 'الخطة' },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'driverName', label: 'السائق' },
          { key: 'binCode', label: 'الصندوق' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
          {
            key: 'paymentStatus',
            label: 'الدفع',
            render: (row) => <StatusBadge status={String(row.paymentStatus)} />,
            sortable: false,
          },
        ]}
      />
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Driver, User } from '../../types';
import {
  areaNameById,
  cityNameById,
  getId,
  userNameById,
  userPhoneById,
} from './shared';

type DriversPageProps = {
  drivers: Driver[];
  users: User[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
};

export function DriversPage({
  drivers,
  users,
  cities,
  areas,
  loading = false,
}: DriversPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      drivers.map((driver) => ({
        ...driver,
        driverName: userNameById(users, driver.userId),
        phone: userPhoneById(users, driver.userId),
        cityName: cityNameById(cities, driver.cityId),
        areaName: areaNameById(areas, driver.areaId),
        codeLabel: driver.code ?? '—',
      })),
    [areas, cities, drivers, users],
  );

  const activeCount = drivers.filter((d) => (d.status ?? 'active') === 'active').length;
  const inactiveCount = drivers.filter((d) => d.status === 'inactive').length;
  const unassignedArea = drivers.filter((d) => !d.areaId || !d.cityId).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">السائقون</h2>
          <p className="page-header__description">
            إدارة السائقين ومناطق عملهم ومركباتهم
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/drivers/new')}>
          إضافة سائق
        </Button>
      </header>

      <div className="customers-stats customers-stats--4">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{drivers.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">معطّل</span>
          <strong className="customers-stat__value">{inactiveCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">بدون منطقة</span>
          <strong className="customers-stat__value">{unassignedArea}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة السائقين"
        description="اضغط على صف لفتح صفحة التفاصيل"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/drivers/${getId(row)}`)}
        searchKeys={[
          'driverName',
          'phone',
          'vehicleNumber',
          'cityName',
          'areaName',
          'codeLabel',
          'status',
        ]}
        columns={[
          { key: 'driverName', label: COMMON.driver },
          {
            key: 'phone',
            label: COMMON.phone,
            render: (row) => (
              <span dir="ltr">{row.phone ? String(row.phone) : '—'}</span>
            ),
          },
          { key: 'codeLabel', label: 'الرمز' },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'vehicleNumber', label: COMMON.vehicleNumber },
          {
            key: 'status',
            label: COMMON.status,
            render: (r) => <StatusBadge status={String(r.status ?? 'active')} />,
            sortable: false,
          },
        ]}
      />
    </div>
  );
}

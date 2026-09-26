import { useEffect, useMemo, useState } from 'react';
import { AdminApi } from '../../api/modules';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KpiStat } from '../../components/ui/KpiStat';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatApiError } from '../../i18n/ar';
import type {
  Area,
  City,
  Driver,
  DriverTaskTrackingRow,
  Task,
  User,
} from '../../types';
import {
  areaNameById,
  cityNameById,
  getId,
  userNameById,
} from './shared';

type DriverTrackingPageProps = {
  tasks: Task[];
  drivers: Driver[];
  users: User[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onRefresh?: () => void;
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '';
}

function driverLabel(drivers: Driver[], users: User[], driverId: string) {
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  const name = userNameById(users, driver.userId);
  return driver.vehicleNumber ? `${name} (${driver.vehicleNumber})` : name;
}

export function DriverTrackingPage({
  tasks,
  drivers,
  users,
  cities,
  areas,
  loading = false,
  onRefresh,
}: DriverTrackingPageProps) {
  const [date, setDate] = useState(todayIsoDate);
  const [reportLoading, setReportLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<DriverTaskTrackingRow[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReportLoading(true);
    setError('');
    AdminApi.tasks
      .driverTracking(date)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.drivers);
        setUnassignedTotal(res.data.unassigned.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(formatApiError(err instanceof Error ? err.message : 'Request failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const driver = drivers.find((item) => getId(item) === row.driverId);
        return {
          ...row,
          driverName: driverLabel(drivers, users, row.driverId),
          cityName: cityNameById(cities, driver?.cityId),
          areaName: areaNameById(areas, driver?.areaId),
          activeLabel: (driver?.status ?? 'active') === 'active' ? 'نشط' : 'معطّل',
        };
      }),
    [areas, cities, drivers, rows, users],
  );

  const selectedTasks = useMemo(() => {
    if (!selectedDriverId) return [];
    return tasks
      .filter(
        (task) =>
          task.driverId === selectedDriverId && taskDate(task) === date,
      )
      .map((task) => ({
        ...task,
        areaName: areaNameById(areas, task.areaId),
        cityName: cityNameById(
          cities,
          areas.find((area) => getId(area) === task.areaId)?.cityId,
        ),
        displayDate: taskDate(task),
      }));
  }, [areas, cities, date, selectedDriverId, tasks]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          total: acc.total + row.total,
          completed: acc.completed + row.completed,
          inProgress: acc.inProgress + row.inProgress,
          open:
            acc.open +
            row.pending +
            row.assigned +
            row.inProgress,
        }),
        { total: 0, completed: 0, inProgress: 0, open: 0 },
      ),
    [rows],
  );

  return (
    <div className={`module-page ${selectedDriverId ? 'module-page--with-detail' : ''}`}>
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">تتبع السائقين حسب المهام</h2>
          <p className="page-header__description">
            ملخص مهام الجمع لكل سائق في اليوم المحدد ومتابعة التقدم
          </p>
        </div>
        {onRefresh ? (
          <Button type="button" variant="secondary" onClick={() => onRefresh()}>
            تحديث
          </Button>
        ) : null}
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <div className="row-form">
          <Input
            label="تاريخ المهام"
            type="date"
            value={date}
            onChange={(event) => {
              setSelectedDriverId(null);
              setDate(event.target.value);
            }}
          />
        </div>
      </section>

      <section className="kpi-grid kpi-grid--secondary" aria-label="ملخص اليوم">
        <KpiStat label="مهام السائقين" value={totals.total} />
        <KpiStat label="قيد التنفيذ" value={totals.inProgress} />
        <KpiStat label="مكتملة" value={totals.completed} tone="success" />
        <KpiStat
          label="بدون سائق"
          value={unassignedTotal}
          tone={unassignedTotal > 0 ? 'warning' : 'default'}
        />
      </section>

      <DataTable
        title="السائقون"
        description="اضغط على سائق لعرض مهامه في هذا اليوم"
        rows={tableRows}
        loading={loading || reportLoading}
        onSelect={(row) => setSelectedDriverId(row.driverId)}
        searchKeys={['driverName', 'cityName', 'areaName', 'activeLabel']}
        columns={[
          { key: 'driverName', label: 'السائق' },
          { key: 'cityName', label: 'المدينة' },
          { key: 'areaName', label: 'المنطقة' },
          { key: 'total', label: 'الإجمالي' },
          { key: 'assigned', label: 'معيّنة' },
          { key: 'inProgress', label: 'جارية' },
          { key: 'completed', label: 'مكتملة' },
          { key: 'skipped', label: 'متخطاة' },
        ]}
      />

      {selectedDriverId ? (
        <DetailPanel
          title="مهام السائق"
          subtitle={driverLabel(drivers, users, selectedDriverId)}
          onClose={() => setSelectedDriverId(null)}
        >
          <DataTable
            title={`مهام ${date}`}
            rows={selectedTasks}
            loading={loading}
            searchKeys={['areaName', 'cityName', 'status']}
            columns={[
              { key: 'displayDate', label: 'التاريخ' },
              { key: 'cityName', label: 'المدينة' },
              { key: 'areaName', label: 'المنطقة' },
              {
                key: 'status',
                label: 'الحالة',
                render: (row) => <StatusBadge status={String(row.status)} />,
                sortable: false,
              },
            ]}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Driver, Task, User } from '../../types';
import { areaLabel, areaNameById, cityNameById, getId, userNameById } from './shared';

type TasksPageProps = {
  tasks: Task[];
  areas: Area[];
  cities: City[];
  drivers: Driver[];
  users: User[];
  loading?: boolean;
  onGenerate: (date: string, areaId: string) => Promise<void>;
  onAssign: (id: string, driverId: string) => Promise<void>;
};

function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '—';
}

function driverDisplayName(drivers: Driver[], users: User[], driverId?: string) {
  if (!driverId) return '—';
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  const name = userNameById(users, driver.userId);
  return driver.vehicleNumber ? `${name} (${driver.vehicleNumber})` : name;
}

export function TasksPage({
  tasks,
  areas,
  cities,
  drivers,
  users,
  loading = false,
  onGenerate,
  onAssign,
}: TasksPageProps) {
  const [date, setDate] = useState('');
  const [areaId, setAreaId] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);
  const [driverId, setDriverId] = useState('');
  const [saving, setSaving] = useState(false);

  const tableRows = useMemo(
    () =>
      tasks.map((task) => {
        const area = areas.find((item) => getId(item) === task.areaId);
        return {
          ...task,
          areaName: areaNameById(areas, task.areaId),
          cityName: cityNameById(cities, area?.cityId),
          driverName: driverDisplayName(drivers, users, task.driverId),
          displayDate: taskDate(task),
        };
      }),
    [areas, cities, drivers, tasks, users],
  );

  const selectedArea = useMemo(
    () => areas.find((area) => getId(area) === selected?.areaId),
    [areas, selected?.areaId],
  );

  const matchingDrivers = useMemo(() => {
    if (!selected?.areaId || !selectedArea?.cityId) return [];
    return drivers.filter(
      (driver) =>
        driver.status === 'active' &&
        driver.areaId === selected.areaId &&
        driver.cityId === selectedArea.cityId,
    );
  }, [drivers, selected?.areaId, selectedArea?.cityId]);

  useEffect(() => {
    setDriverId(selected?.driverId ?? '');
  }, [selected]);

  async function submitGenerate(e: FormEvent) {
    e.preventDefault();
    if (!date || !areaId) return;
    setSaving(true);
    try {
      await onGenerate(date, areaId);
    } finally {
      setSaving(false);
    }
  }

  async function submitAssign(e: FormEvent) {
    e.preventDefault();
    if (!selected || !driverId) return;
    setSaving(true);
    try {
      await onAssign(getId(selected), driverId);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="توليد المهام"
        description="أنشئ مهام جمع لاشتراكات منطقة معينة في تاريخ محدد"
        onSubmit={submitGenerate}
        submitLabel="توليد المهام"
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="التاريخ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            label={COMMON.area}
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            required
          >
            <option value="">{COMMON.selectArea}</option>
            {areas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {areaLabel(area, cities)}
              </option>
            ))}
          </Select>
        </div>
      </FormCard>

      <DataTable
        title="المهام"
        description="متابعة مهام الجمع وتعيين السائقين حسب المنطقة"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['displayDate', 'areaName', 'cityName', 'driverName', 'status']}
        columns={[
          { key: 'displayDate', label: 'التاريخ' },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'driverName', label: 'السائق' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تفاصيل المهمة"
          subtitle={`${cityNameById(cities, selectedArea?.cityId)} — ${areaNameById(areas, selected.areaId)}`}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات المهمة</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>التاريخ</dt>
                  <dd>{taskDate(selected)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.city}</dt>
                  <dd>{cityNameById(cities, selectedArea?.cityId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.area}</dt>
                  <dd>{areaNameById(areas, selected.areaId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>السائق</dt>
                  <dd>{driverDisplayName(drivers, users, selected.driverId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.status}</dt>
                  <dd>
                    <StatusBadge status={selected.status ?? 'pending'} />
                  </dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">تعيين السائق</h4>
              <form className="detail-form" onSubmit={submitAssign}>
                <Select
                  label="السائق"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                >
                  <option value="">اختر السائق</option>
                  {matchingDrivers.map((driver) => (
                    <option key={getId(driver)} value={getId(driver)}>
                      {userNameById(users, driver.userId)} — {driver.vehicleNumber ?? '—'}
                    </option>
                  ))}
                </Select>
                {!matchingDrivers.length ? (
                  <p className="field__hint">لا يوجد سائقون نشطون يخدمون منطقة هذه المهمة.</p>
                ) : null}
                <Button type="submit" disabled={saving || !driverId}>
                  تعيين السائق
                </Button>
              </form>
            </section>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

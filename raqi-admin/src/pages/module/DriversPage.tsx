import { FormEvent, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Driver, User } from '../../types';
import {
  areaNameById,
  areasForCity,
  cityNameById,
  getId,
  userNameById,
} from './shared';

type DriversPageProps = {
  drivers: Driver[];
  users: User[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onCreate: (body: {
    email: string;
    name: string;
    password: string;
    vehicleNumber: string;
    cityId: string;
    areaId: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    body: { vehicleNumber?: string; cityId?: string; areaId?: string },
  ) => Promise<void>;
  onSetStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
};

const emptyForm = {
  email: '',
  name: '',
  password: '',
  vehicleNumber: '',
  cityId: '',
  areaId: '',
};

export function DriversPage({
  drivers,
  users,
  cities,
  areas,
  loading = false,
  onCreate,
  onUpdate,
  onSetStatus,
}: DriversPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: 'active' | 'inactive' } | null>(null);
  const [saving, setSaving] = useState(false);

  const formAreas = useMemo(() => areasForCity(areas, form.cityId), [areas, form.cityId]);
  const selectedAreas = useMemo(
    () => areasForCity(areas, selected?.cityId ?? ''),
    [areas, selected?.cityId],
  );

  const tableRows = useMemo(
    () =>
      drivers.map((driver) => ({
        ...driver,
        driverName: userNameById(users, driver.userId),
        cityName: cityNameById(cities, driver.cityId),
        areaName: areaNameById(areas, driver.areaId),
      })),
    [areas, cities, drivers, users],
  );

  const hasLocations = cities.length > 0 && areas.length > 0;

  function handleCityChange(cityId: string, target: 'form' | 'selected') {
    if (target === 'form') {
      setForm((prev) => ({ ...prev, cityId, areaId: '' }));
      return;
    }
    if (!selected) return;
    setSelected({ ...selected, cityId, areaId: '' });
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.cityId || !form.areaId) return;
    setSaving(true);
    try {
      await onCreate(form);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected?.cityId || !selected.areaId) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), {
        vehicleNumber: selected.vehicleNumber,
        cityId: selected.cityId,
        areaId: selected.areaId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة سائق"
        description="أنشئ حساب سائق مع تحديد المدينة والمنطقة التي يعمل بها"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label={COMMON.email}
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label={COMMON.name}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={COMMON.password}
            type="password"
            dir="ltr"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            label={COMMON.vehicleNumber}
            value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
            placeholder="مثال: طرابلس-1234"
            required
          />
          <Select
            label={COMMON.city}
            value={form.cityId}
            onChange={(e) => handleCityChange(e.target.value, 'form')}
            required
            disabled={!cities.length}
          >
            <option value="">{COMMON.selectCity}</option>
            {cities.map((city) => (
              <option key={getId(city)} value={getId(city)}>
                {city.name}
              </option>
            ))}
          </Select>
          <Select
            label={COMMON.area}
            value={form.areaId}
            onChange={(e) => setForm({ ...form, areaId: e.target.value })}
            required
            disabled={!form.cityId}
          >
            <option value="">{COMMON.selectArea}</option>
            {formAreas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
        {!hasLocations ? (
          <p className="field__hint">أضف مدنًا ومناطق من صفحة المدن والمناطق قبل إنشاء سائق.</p>
        ) : null}
      </FormCard>

      <DataTable
        title="السائقون"
        description="إدارة السائقين ومناطق عملهم"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['driverName', 'vehicleNumber', 'cityName', 'areaName', 'status']}
        columns={[
          { key: 'driverName', label: COMMON.driver },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'vehicleNumber', label: COMMON.vehicleNumber },
          {
            key: 'status',
            label: COMMON.status,
            render: (r) => <StatusBadge status={String(r.status)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تعديل السائق"
          subtitle={userNameById(users, selected.userId)}
          onClose={() => setSelected(null)}
          footer={
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setConfirm({
                  id: getId(selected),
                  status: selected.status === 'active' ? 'inactive' : 'active',
                })
              }
            >
              {selected.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </Button>
          }
        >
          <form className="form-grid" onSubmit={submitUpdate}>
            <Input
              label={COMMON.vehicleNumber}
              value={selected.vehicleNumber ?? ''}
              onChange={(e) => setSelected({ ...selected, vehicleNumber: e.target.value })}
              required
            />
            <Select
              label={COMMON.city}
              value={selected.cityId ?? ''}
              onChange={(e) => handleCityChange(e.target.value, 'selected')}
              required
            >
              <option value="">{COMMON.selectCity}</option>
              {cities.map((city) => (
                <option key={getId(city)} value={getId(city)}>
                  {city.name}
                </option>
              ))}
            </Select>
            <Select
              label={COMMON.area}
              value={selected.areaId ?? ''}
              onChange={(e) => setSelected({ ...selected, areaId: e.target.value })}
              required
              disabled={!selected.cityId}
            >
              <option value="">{COMMON.selectArea}</option>
              {selectedAreas.map((area) => (
                <option key={getId(area)} value={getId(area)}>
                  {area.name}
                </option>
              ))}
            </Select>
            <div className="form-grid__actions">
              <Button type="submit" disabled={saving || !selected.cityId || !selected.areaId}>
                {saving ? 'جاري الحفظ...' : COMMON.save}
              </Button>
            </div>
          </form>
        </DetailPanel>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="تغيير حالة السائق"
        description="هل تريد تأكيد تحديث حالة هذا السائق؟"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          void onSetStatus(confirm.id, confirm.status);
          setConfirm(null);
        }}
      />
    </div>
  );
}

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
  userEmailById,
  userNameById,
  userPhoneById,
} from './shared';

type DriversPageProps = {
  drivers: Driver[];
  users: User[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onCreate: (body: {
    phone: string;
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
  onDelete: (id: string) => Promise<void>;
};

const emptyForm = {
  phone: '',
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
  onDelete,
}: DriversPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: 'active' | 'inactive' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
        phone: userPhoneById(users, driver.userId),
        cityName: cityNameById(cities, driver.cityId),
        areaName: areaNameById(areas, driver.areaId),
        codeLabel: driver.code ?? '—',
      })),
    [areas, cities, drivers, users],
  );

  const hasLocations = cities.length > 0 && areas.length > 0;

  const selectedName = selected ? userNameById(users, selected.userId) : '—';
  const selectedPhone = selected ? userPhoneById(users, selected.userId) : '—';
  const selectedEmail = selected ? userEmailById(users, selected.userId) : '—';

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
      await onCreate({
        phone: form.phone.trim(),
        name: form.name,
        password: form.password,
        vehicleNumber: form.vehicleNumber,
        cityId: form.cityId,
        areaId: form.areaId,
      });
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
            label={COMMON.phone}
            type="tel"
            dir="ltr"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
        searchKeys={['driverName', 'phone', 'vehicleNumber', 'cityName', 'areaName', 'codeLabel', 'status']}
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
            render: (r) => <StatusBadge status={String(r.status)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title={selectedName}
          subtitle={selectedPhone !== '—' ? selectedPhone : undefined}
          onClose={() => setSelected(null)}
          footer={
            <>
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
              <Button type="button" variant="ghost" onClick={() => setDeleteId(getId(selected))}>
                حذف الحساب
              </Button>
            </>
          }
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات الحساب</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>{COMMON.name}</dt>
                  <dd>{selectedName}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.phone}</dt>
                  <dd dir="ltr">{selectedPhone}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.email}</dt>
                  <dd dir="ltr">{selectedEmail}</dd>
                </div>
                <div className="info-list__row">
                  <dt>رمز السائق</dt>
                  <dd dir="ltr">{selected.code ?? '—'}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.status}</dt>
                  <dd>
                    <StatusBadge status={selected.status ?? 'active'} />
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>التقييم</dt>
                  <dd>{selected.rating != null ? selected.rating : '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">منطقة العمل</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>{COMMON.city}</dt>
                  <dd>{cityNameById(cities, selected.cityId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.area}</dt>
                  <dd>{areaNameById(areas, selected.areaId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>{COMMON.vehicleNumber}</dt>
                  <dd>{selected.vehicleNumber ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">تعديل البيانات</h4>
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
            </section>
          </div>
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

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="حذف حساب السائق"
        description="سيتم حذف الحساب نهائياً ولن يتمكن السائق من تسجيل الدخول. هل أنت متأكد؟"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void onDelete(deleteId).then(() => {
            setDeleteId(null);
            setSelected(null);
          });
        }}
      />
    </div>
  );
}

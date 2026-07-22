import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
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

type DriverDetailPageProps = {
  drivers: Driver[];
  users: User[];
  cities: City[];
  areas: Area[];
  onUpdate: (
    id: string,
    body: { vehicleNumber?: string; cityId?: string; areaId?: string },
  ) => Promise<void>;
  onSetPassword: (id: string, password: string) => Promise<void>;
  onSetStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function DriverDetailPage({
  drivers,
  users,
  cities,
  areas,
  onUpdate,
  onSetPassword,
  onSetStatus,
  onDelete,
}: DriverDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const driver = useMemo(
    () => drivers.find((item) => getId(item) === id) ?? null,
    [drivers, id],
  );

  const [editForm, setEditForm] = useState({
    vehicleNumber: '',
    cityId: '',
    areaId: '',
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<'active' | 'inactive' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!driver) return;
    setEditForm({
      vehicleNumber: driver.vehicleNumber ?? '',
      cityId: driver.cityId ?? '',
      areaId: driver.areaId ?? '',
    });
  }, [driver]);

  const editAreas = useMemo(
    () => areasForCity(areas, editForm.cityId),
    [areas, editForm.cityId],
  );

  const name = driver ? userNameById(users, driver.userId) : '—';
  const phone = driver ? userPhoneById(users, driver.userId) : '—';
  const email = driver ? userEmailById(users, driver.userId) : '—';

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!driver || !editForm.cityId || !editForm.areaId) return;
    setSaving(true);
    try {
      await onUpdate(getId(driver), {
        vehicleNumber: editForm.vehicleNumber.trim(),
        cityId: editForm.cityId,
        areaId: editForm.areaId,
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    if (!driver) return;
    setPasswordError('');
    if (passwordForm.password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    setSaving(true);
    try {
      await onSetPassword(getId(driver), passwordForm.password);
      setPasswordForm({ password: '', confirm: '' });
    } finally {
      setSaving(false);
    }
  }

  if (!driver) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/drivers')}>
          ← العودة إلى السائقين
        </Button>
        <div className="customer-empty">
          <h2>السائق غير موجود</h2>
          <p>تعذر العثور على هذا السائق أو تم حذفه.</p>
          <Button type="button" onClick={() => navigate('/drivers')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page customer-detail-page">
      <header className="customer-detail-hero">
        <div className="customer-detail-hero__top">
          <Button type="button" variant="ghost" onClick={() => navigate('/drivers')}>
            ← العودة إلى السائقين
          </Button>
          <div className="row-form">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setConfirmStatus(driver.status === 'active' ? 'inactive' : 'active')
              }
            >
              {driver.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              حذف الحساب
            </Button>
          </div>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل السائق</p>
            <h2 className="customer-detail-hero__title">{name}</h2>
            <div className="customer-detail-hero__meta">
              <span dir="ltr">{phone}</span>
              {driver.code ? <span dir="ltr">الرمز: {driver.code}</span> : null}
              <span>
                {cityNameById(cities, driver.cityId)} · {areaNameById(areas, driver.areaId)}
              </span>
              <StatusBadge status={driver.status ?? 'active'} />
            </div>
          </div>
        </div>
      </header>

      <div className="customer-detail-grid">
        <section className="customer-detail-card">
          <h3 className="customer-form-section__title">معلومات الحساب</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>{COMMON.name}</dt>
              <dd>{name}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.phone}</dt>
              <dd dir="ltr">{phone}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.email}</dt>
              <dd dir="ltr">{email}</dd>
            </div>
            <div className="info-list__row">
              <dt>رمز السائق</dt>
              <dd dir="ltr">{driver.code ?? '—'}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.status}</dt>
              <dd>
                <StatusBadge status={driver.status ?? 'active'} />
              </dd>
            </div>
            <div className="info-list__row">
              <dt>التقييم</dt>
              <dd>{driver.rating != null ? driver.rating : '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="customer-detail-card">
          <h3 className="customer-form-section__title">منطقة العمل الحالية</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>{COMMON.city}</dt>
              <dd>{cityNameById(cities, driver.cityId)}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.area}</dt>
              <dd>{areaNameById(areas, driver.areaId)}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.vehicleNumber}</dt>
              <dd>{driver.vehicleNumber ?? '—'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <FormCard
        title="تعديل المركبة والمنطقة"
        description="غيّر رقم المركبة أو منطقة العمل ثم احفظ"
        onSubmit={submitUpdate}
        submitLabel="حفظ التغييرات"
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label={COMMON.vehicleNumber}
            value={editForm.vehicleNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, vehicleNumber: e.target.value })
            }
            required
          />
          <Select
            label={COMMON.city}
            value={editForm.cityId}
            onChange={(e) =>
              setEditForm({ ...editForm, cityId: e.target.value, areaId: '' })
            }
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
            value={editForm.areaId}
            onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value })}
            required
            disabled={!editForm.cityId}
          >
            <option value="">{COMMON.selectArea}</option>
            {editAreas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
      </FormCard>

      <FormCard
        title="تغيير كلمة المرور"
        description="أدخل كلمة مرور جديدة لتسجيل دخول السائق"
        onSubmit={submitPassword}
        submitLabel="تحديث كلمة المرور"
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={passwordForm.password}
            onChange={(e) => {
              setPasswordError('');
              setPasswordForm({ ...passwordForm, password: e.target.value });
            }}
            required
            minLength={6}
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={passwordForm.confirm}
            onChange={(e) => {
              setPasswordError('');
              setPasswordForm({ ...passwordForm, confirm: e.target.value });
            }}
            required
            minLength={6}
          />
        </div>
        {passwordError ? <p className="error">{passwordError}</p> : null}
      </FormCard>

      <ConfirmDialog
        open={Boolean(confirmStatus)}
        title="تغيير حالة السائق"
        description="هل تريد تأكيد تحديث حالة هذا السائق؟"
        onCancel={() => setConfirmStatus(null)}
        onConfirm={() => {
          if (!confirmStatus) return;
          void onSetStatus(getId(driver), confirmStatus);
          setConfirmStatus(null);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="حذف حساب السائق"
        description="سيتم حذف الحساب نهائياً ولن يتمكن السائق من تسجيل الدخول. هل أنت متأكد؟"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void onDelete(getId(driver)).then(() => {
            setConfirmDelete(false);
            navigate('/drivers');
          });
        }}
      />
    </div>
  );
}

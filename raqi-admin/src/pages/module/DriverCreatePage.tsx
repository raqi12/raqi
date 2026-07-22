import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Driver } from '../../types';
import { areasForCity, getId } from './shared';

type DriverCreatePageProps = {
  cities: City[];
  areas: Area[];
  onCreate: (body: {
    phone: string;
    name: string;
    password: string;
    vehicleNumber: string;
    cityId: string;
    areaId: string;
  }) => Promise<Driver | undefined>;
};

const emptyForm = {
  phone: '',
  name: '',
  password: '',
  vehicleNumber: '',
  cityId: '',
  areaId: '',
};

export function DriverCreatePage({ cities, areas, onCreate }: DriverCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const formAreas = useMemo(() => areasForCity(areas, form.cityId), [areas, form.cityId]);
  const hasLocations = cities.length > 0 && areas.length > 0;
  const selectedCityName = cities.find((c) => getId(c) === form.cityId)?.name;
  const selectedAreaName = formAreas.find((a) => getId(a) === form.areaId)?.name;

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.cityId || !form.areaId) return;
    setSaving(true);
    try {
      const created = await onCreate({
        phone: form.phone.trim(),
        name: form.name.trim(),
        password: form.password,
        vehicleNumber: form.vehicleNumber.trim(),
        cityId: form.cityId,
        areaId: form.areaId,
      });
      if (created) {
        navigate(`/drivers/${getId(created)}`);
        return;
      }
      navigate('/drivers');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/drivers')}>
          ← العودة إلى السائقين
        </Button>
        <h2 className="page-header__title">إضافة سائق</h2>
        <p className="page-header__description">
          أنشئ حساب سائق مع تحديد المدينة والمنطقة التي يعمل بها
        </p>
      </header>

      <FormCard
        title="بيانات السائق"
        description="رقم الهاتف وكلمة المرور يستخدمان لتسجيل الدخول في تطبيق السائق"
        onSubmit={submitCreate}
        submitLabel="إنشاء السائق"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">1. معلومات الدخول</h3>
            <div className="form-grid">
              <Input
                label={COMMON.name}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label={COMMON.phone}
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <Input
                label={COMMON.password}
                type="password"
                dir="ltr"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">2. المركبة</h3>
            <div className="form-grid">
              <Input
                label={COMMON.vehicleNumber}
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                placeholder="مثال: طرابلس-1234"
                required
              />
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">3. منطقة العمل</h3>
            <div className="form-grid">
              <Select
                label={COMMON.city}
                value={form.cityId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cityId: e.target.value, areaId: '' }))
                }
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
            {selectedCityName || selectedAreaName ? (
              <p className="field__hint">
                المنطقة المحددة:{' '}
                {[selectedCityName, selectedAreaName].filter(Boolean).join(' · ') || '—'}
              </p>
            ) : null}
            {!hasLocations ? (
              <p className="field__hint">
                أضف مدنًا ومناطق من صفحة المدن والمناطق قبل إنشاء سائق.
              </p>
            ) : null}
          </section>
        </div>
      </FormCard>
    </div>
  );
}

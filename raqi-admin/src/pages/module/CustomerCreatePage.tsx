import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Customer } from '../../types';
import { areasForCity, getId } from './shared';

type CustomerCreatePageProps = {
  cities: City[];
  areas: Area[];
  onCreate: (body: {
    email?: string;
    phone: string;
    name: string;
    password: string;
    cityId: string;
    areaId: string;
    lat: number;
    lng: number;
  }) => Promise<Customer | undefined>;
};

const emptyForm = {
  email: '',
  phone: '',
  name: '',
  password: '',
  cityId: '',
  areaId: '',
  lat: '',
  lng: '',
};

export function CustomerCreatePage({ cities, areas, onCreate }: CustomerCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const formAreas = useMemo(() => areasForCity(areas, form.cityId), [areas, form.cityId]);
  const hasLocations = cities.length > 0 && areas.length > 0;

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.cityId || !form.areaId) return;
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    setSaving(true);
    try {
      const created = await onCreate({
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        phone: form.phone.trim(),
        name: form.name,
        password: form.password,
        cityId: form.cityId,
        areaId: form.areaId,
        lat,
        lng,
      });
      if (created) {
        navigate(`/customers/${getId(created)}`);
        return;
      }
      navigate('/customers');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/customers')}>
          ← العودة إلى العملاء
        </Button>
        <h2 className="page-header__title">إضافة عميل</h2>
        <p className="page-header__description">
          أنشئ حساب عميل جديد مع المدينة والمنطقة وإحداثيات العنوان الافتراضي
        </p>
      </header>

      <FormCard
        title="بيانات الحساب"
        description="رقم الهاتف وكلمة المرور يستخدمان لتسجيل الدخول في التطبيق"
        onSubmit={submitCreate}
        submitLabel="إنشاء العميل"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">معلومات الدخول</h3>
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
                label={COMMON.email}
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                hint="اختياري"
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
            <h3 className="customer-form-section__title">الموقع الافتراضي</h3>
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
              <Input
                label="خط العرض (lat)"
                type="number"
                step="any"
                dir="ltr"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                required
              />
              <Input
                label="خط الطول (lng)"
                type="number"
                step="any"
                dir="ltr"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                required
              />
            </div>
            {!hasLocations ? (
              <p className="field__hint">
                أضف مدنًا ومناطق من صفحة المدن والمناطق قبل إنشاء عميل.
              </p>
            ) : null}
          </section>
        </div>
      </FormCard>
    </div>
  );
}

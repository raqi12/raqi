import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type { Plan } from '../../types';
import { getId } from './shared';
import {
  PLAN_ACTIVITY_OPTIONS,
  PLAN_FREQUENCY_OPTIONS,
  type PlanActivityType,
  type PlanFrequency,
} from './planUi';

type PlanCreatePageProps = {
  onCreate: (body: {
    name: string;
    activityType: PlanActivityType;
    price: number;
    frequency: PlanFrequency;
    durationDays: number;
    numberOfCollections: number;
    active?: boolean;
  }) => Promise<Plan | undefined>;
};

const emptyForm = {
  name: '',
  activityType: 'home' as PlanActivityType,
  price: '',
  frequency: 'monthly' as PlanFrequency,
  durationDays: '30',
  numberOfCollections: '4',
  active: true,
};

export function PlanCreatePage({ onCreate }: PlanCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);
    const numberOfCollections = Number(form.numberOfCollections);
    if (!form.name.trim() || !price || !durationDays || !numberOfCollections) return;

    setSaving(true);
    try {
      const created = await onCreate({
        name: form.name.trim(),
        activityType: form.activityType,
        price,
        frequency: form.frequency,
        durationDays,
        numberOfCollections,
        active: form.active,
      });
      if (created) {
        navigate(`/plans/${getId(created)}`);
        return;
      }
      navigate('/plans');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/plans')}>
          ← العودة إلى الخطط
        </Button>
        <h2 className="page-header__title">إضافة خطة</h2>
        <p className="page-header__description">
          أنشئ خطة اشتراك جديدة مع تحديد نوع النشاط والسعر والتكرار وعدد الجولات
        </p>
      </header>

      <FormCard
        title="بيانات الخطة"
        description="ستظهر هذه الخطة للعملاء عند الاشتراك حسب نوع النشاط"
        onSubmit={submitCreate}
        submitLabel="إنشاء الخطة"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">1. التعريف</h3>
            <div className="form-grid">
              <Input
                label="اسم الخطة"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: الخطة الشهرية المنزلية"
                required
              />
              <Select
                label={COMMON.type}
                value={form.activityType}
                onChange={(e) =>
                  setForm({ ...form, activityType: e.target.value as PlanActivityType })
                }
                required
              >
                {PLAN_ACTIVITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                label={COMMON.status}
                value={form.active ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </Select>
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">2. التسعير والمدة</h3>
            <div className="form-grid">
              <Input
                label="السعر (د.ل)"
                type="number"
                min={0}
                step={0.01}
                dir="ltr"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
              />
              <Select
                label="التكرار"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value as PlanFrequency })
                }
                required
              >
                {PLAN_FREQUENCY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input
                label="المدة (أيام)"
                type="number"
                min={1}
                dir="ltr"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                required
              />
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">3. الجولات</h3>
            <div className="form-grid">
              <Input
                label="عدد الجولات"
                type="number"
                min={1}
                dir="ltr"
                value={form.numberOfCollections}
                onChange={(e) => setForm({ ...form, numberOfCollections: e.target.value })}
                required
              />
            </div>
            <p className="field__hint">
              عدد مرات الجمع ضمن مدة الخطة (مثال: 4 جولات خلال 30 يوماً).
            </p>
          </section>
        </div>
      </FormCard>
    </div>
  );
}

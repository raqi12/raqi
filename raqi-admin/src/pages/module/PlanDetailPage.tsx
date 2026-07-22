import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Plan } from '../../types';
import { getId } from './shared';
import {
  formatPlanPrice,
  PLAN_ACTIVITY_OPTIONS,
  PLAN_FREQUENCY_OPTIONS,
  planActivityLabel,
  planFrequencyLabel,
  type PlanActivityType,
  type PlanFrequency,
} from './planUi';

type PlanDetailPageProps = {
  plans: Plan[];
  onUpdate: (
    id: string,
    body: {
      name?: string;
      activityType?: PlanActivityType;
      price?: number;
      frequency?: PlanFrequency;
      durationDays?: number;
      numberOfCollections?: number;
      active?: boolean;
    },
  ) => Promise<void>;
};

export function PlanDetailPage({ plans, onUpdate }: PlanDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const plan = useMemo(() => plans.find((item) => getId(item) === id) ?? null, [id, plans]);

  const [form, setForm] = useState({
    name: '',
    activityType: 'home' as PlanActivityType,
    price: '',
    frequency: 'monthly' as PlanFrequency,
    durationDays: '',
    numberOfCollections: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setForm({
      name: plan.name ?? '',
      activityType: (plan.activityType as PlanActivityType) ?? 'home',
      price: plan.price != null ? String(plan.price) : '',
      frequency: plan.frequency ?? 'monthly',
      durationDays: plan.durationDays != null ? String(plan.durationDays) : '',
      numberOfCollections:
        plan.numberOfCollections != null ? String(plan.numberOfCollections) : '',
      active: plan.active !== false,
    });
  }, [plan]);

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!plan) return;
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);
    const numberOfCollections = Number(form.numberOfCollections);
    if (!form.name.trim() || !price || !durationDays || !numberOfCollections) return;

    setSaving(true);
    try {
      await onUpdate(getId(plan), {
        name: form.name.trim(),
        activityType: form.activityType,
        price,
        frequency: form.frequency,
        durationDays,
        numberOfCollections,
        active: form.active,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!plan) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/plans')}>
          ← العودة إلى الخطط
        </Button>
        <div className="customer-empty">
          <h2>الخطة غير موجودة</h2>
          <p>تعذر العثور على هذه الخطة أو تم حذفها.</p>
          <Button type="button" onClick={() => navigate('/plans')}>
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
          <Button type="button" variant="ghost" onClick={() => navigate('/plans')}>
            ← العودة إلى الخطط
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل الخطة</p>
            <h2 className="customer-detail-hero__title">{plan.name || '—'}</h2>
            <div className="customer-detail-hero__meta">
              <span>{planActivityLabel(plan.activityType)}</span>
              <span>{planFrequencyLabel(plan.frequency)}</span>
              <span>{formatPlanPrice(plan.price)}</span>
              <StatusBadge status={plan.active !== false ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>
      </header>

      <div className="customer-detail-grid">
        <section className="customer-detail-card">
          <h3 className="customer-form-section__title">ملخص الخطة</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>اسم الخطة</dt>
              <dd>{plan.name ?? '—'}</dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.type}</dt>
              <dd>{planActivityLabel(plan.activityType)}</dd>
            </div>
            <div className="info-list__row">
              <dt>السعر</dt>
              <dd>{formatPlanPrice(plan.price)}</dd>
            </div>
            <div className="info-list__row">
              <dt>التكرار</dt>
              <dd>{planFrequencyLabel(plan.frequency)}</dd>
            </div>
            <div className="info-list__row">
              <dt>المدة</dt>
              <dd>{plan.durationDays != null ? `${plan.durationDays} يوم` : '—'}</dd>
            </div>
            <div className="info-list__row">
              <dt>الجولات</dt>
              <dd>
                {plan.numberOfCollections != null
                  ? `${plan.numberOfCollections} جولة`
                  : '—'}
              </dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.status}</dt>
              <dd>
                <StatusBadge status={plan.active !== false ? 'active' : 'inactive'} />
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <FormCard
        title="تعديل الخطة"
        description="حدّث التعريف أو التسعير أو عدد الجولات ثم احفظ"
        onSubmit={submitUpdate}
        submitLabel="حفظ التغييرات"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">التعريف</h3>
            <div className="form-grid">
              <Input
                label="اسم الخطة"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Select
                label={COMMON.type}
                value={form.activityType}
                onChange={(e) =>
                  setForm({ ...form, activityType: e.target.value as PlanActivityType })
                }
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
            <h3 className="customer-form-section__title">التسعير والمدة</h3>
            <div className="form-grid">
              <Input
                label="السعر (د.ل)"
                type="number"
                min={0}
                step={0.01}
                dir="ltr"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <Select
                label="التكرار"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value as PlanFrequency })
                }
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
          </section>
        </div>
      </FormCard>
    </div>
  );
}

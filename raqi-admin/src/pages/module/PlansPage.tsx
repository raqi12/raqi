import { FormEvent, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, PLAN_FREQUENCIES } from '../../i18n/ar';
import type { Plan } from '../../types';
import { getId } from './shared';

type PlanFrequency = 'weekly' | 'monthly' | 'custom';

type PlansPageProps = {
  plans: Plan[];
  loading?: boolean;
  onCreate: (body: {
    name: string;
    price: number;
    frequency: PlanFrequency;
    durationDays: number;
    numberOfCollections: number;
    active?: boolean;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    body: {
      name?: string;
      price?: number;
      frequency?: PlanFrequency;
      durationDays?: number;
      numberOfCollections?: number;
      active?: boolean;
    },
  ) => Promise<void>;
};

const emptyForm = {
  name: '',
  price: '',
  frequency: 'monthly' as PlanFrequency,
  durationDays: '30',
  numberOfCollections: '4',
  active: true,
};

function formatPrice(price?: number) {
  if (price == null) return '—';
  return `${price.toLocaleString('ar-LY')} د.ل`;
}

export function PlansPage({ plans, loading = false, onCreate, onUpdate }: PlansPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const tableRows = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        frequencyLabel: PLAN_FREQUENCIES[plan.frequency ?? ''] ?? plan.frequency ?? '—',
        priceLabel: formatPrice(plan.price),
        durationLabel: plan.durationDays != null ? `${plan.durationDays} يوم` : '—',
        collectionsLabel:
          plan.numberOfCollections != null ? `${plan.numberOfCollections} جولة` : '—',
        statusKey: plan.active ? 'active' : 'inactive',
      })),
    [plans],
  );

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);
    const numberOfCollections = Number(form.numberOfCollections);
    if (!form.name.trim() || !price || !durationDays || !numberOfCollections) return;

    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        price,
        frequency: form.frequency,
        durationDays,
        numberOfCollections,
        active: form.active,
      });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), {
        name: selected.name,
        price: selected.price,
        frequency: selected.frequency,
        durationDays: selected.durationDays,
        numberOfCollections: selected.numberOfCollections,
        active: selected.active,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة خطة"
        description="أنشئ خطة اشتراك جديدة مع تحديد السعر والتكرار وعدد الجولات"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="اسم الخطة"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: الخطة الشهرية"
            required
          />
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
            onChange={(e) => setForm({ ...form, frequency: e.target.value as PlanFrequency })}
            required
          >
            {Object.entries(PLAN_FREQUENCIES).map(([value, label]) => (
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
          <Select
            label={COMMON.status}
            value={form.active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
          >
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </Select>
        </div>
      </FormCard>

      <DataTable
        title="الخطط"
        description="إدارة خطط الاشتراك المتاحة للعملاء"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['name', 'frequencyLabel', 'priceLabel', 'durationLabel', 'collectionsLabel']}
        columns={[
          { key: 'name', label: 'اسم الخطة' },
          { key: 'priceLabel', label: 'السعر' },
          { key: 'frequencyLabel', label: 'التكرار' },
          { key: 'durationLabel', label: 'المدة' },
          { key: 'collectionsLabel', label: 'الجولات' },
          {
            key: 'statusKey',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.statusKey)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تعديل الخطة"
          subtitle={selected.name}
          onClose={() => setSelected(null)}
        >
          <form className="form-grid" onSubmit={submitUpdate}>
            <Input
              label="اسم الخطة"
              value={selected.name ?? ''}
              onChange={(e) => setSelected({ ...selected, name: e.target.value })}
              required
            />
            <Input
              label="السعر (د.ل)"
              type="number"
              min={0}
              step={0.01}
              dir="ltr"
              value={selected.price ?? 0}
              onChange={(e) => setSelected({ ...selected, price: Number(e.target.value) })}
              required
            />
            <Select
              label="التكرار"
              value={selected.frequency ?? 'monthly'}
              onChange={(e) =>
                setSelected({ ...selected, frequency: e.target.value as PlanFrequency })
              }
            >
              {Object.entries(PLAN_FREQUENCIES).map(([value, label]) => (
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
              value={selected.durationDays ?? 0}
              onChange={(e) => setSelected({ ...selected, durationDays: Number(e.target.value) })}
              required
            />
            <Input
              label="عدد الجولات"
              type="number"
              min={1}
              dir="ltr"
              value={selected.numberOfCollections ?? 0}
              onChange={(e) =>
                setSelected({ ...selected, numberOfCollections: Number(e.target.value) })
              }
              required
            />
            <Select
              label={COMMON.status}
              value={selected.active ? 'active' : 'inactive'}
              onChange={(e) => setSelected({ ...selected, active: e.target.value === 'active' })}
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </Select>
            <div className="form-grid__actions">
              <Button type="submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : COMMON.save}
              </Button>
            </div>
          </form>
        </DetailPanel>
      ) : null}
    </div>
  );
}

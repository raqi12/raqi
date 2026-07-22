import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Bin } from '../../types';
import { getId } from './shared';

type BinCreatePageProps = {
  onCreate: (body: {
    code: string;
    capacity?: number;
    fee?: number;
    totalCount: number;
  }) => Promise<Bin | undefined>;
};

const emptyForm = {
  code: '',
  capacity: '',
  fee: '',
  totalCount: '',
};

export function BinCreatePage({ onCreate }: BinCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || form.totalCount === '') return;
    setSaving(true);
    try {
      const created = await onCreate({
        code: form.code.trim(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        fee: form.fee ? Number(form.fee) : undefined,
        totalCount: Number(form.totalCount),
      });
      if (created) {
        navigate(`/bins/${getId(created)}`);
        return;
      }
      navigate('/bins');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/bins')}>
          ← العودة إلى الصناديق
        </Button>
        <h2 className="page-header__title">إضافة نوع صندوق</h2>
        <p className="page-header__description">
          سجّل نوع صندوق مع الكمية الإجمالية المتاحة في المخزون
        </p>
      </header>

      <FormCard
        title="بيانات الصندوق"
        description="الرمز يميّز نوع الصندوق في المخزون والاشتراكات"
        onSubmit={submitCreate}
        submitLabel="إنشاء الصندوق"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">1. التعريف</h3>
            <div className="form-grid">
              <Input
                label="رمز الصندوق"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="مثال: BIN-240L"
                dir="ltr"
                required
              />
              <Input
                label="السعة (لتر)"
                type="number"
                min={0}
                dir="ltr"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="240"
              />
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">2. الرسوم والمخزون</h3>
            <div className="form-grid">
              <Input
                label="الرسوم (د.ل)"
                type="number"
                min={0}
                dir="ltr"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
                placeholder="50"
              />
              <Input
                label="الكمية الإجمالية"
                type="number"
                min={0}
                dir="ltr"
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: e.target.value })}
                placeholder="50"
                required
              />
            </div>
            <p className="field__hint">
              الكمية الإجمالية هي عدد الوحدات المتوفرة من هذا النوع في المخزون.
            </p>
          </section>
        </div>
      </FormCard>
    </div>
  );
}

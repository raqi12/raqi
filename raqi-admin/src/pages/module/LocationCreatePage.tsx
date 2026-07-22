import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { City } from '../../types';
import { getId } from './shared';

type LocationCreatePageProps = {
  onCreateCity: (body: { name: string }) => Promise<City | undefined>;
};

export function LocationCreatePage({ onCreateCity }: LocationCreatePageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await onCreateCity({ name: name.trim() });
      if (created) {
        navigate(`/locations/${getId(created)}`);
        return;
      }
      navigate('/locations');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/locations')}>
          ← العودة إلى المدن والمناطق
        </Button>
        <h2 className="page-header__title">إضافة مدينة</h2>
        <p className="page-header__description">
          أنشئ مدينة جديدة ثم أضف المناطق التابعة لها من صفحة التفاصيل
        </p>
      </header>

      <FormCard
        title="بيانات المدينة"
        description="اسم المدينة كما سيظهر في اختيار الموقع للعملاء والسائقين"
        onSubmit={submitCreate}
        submitLabel="إنشاء المدينة"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">1. التعريف</h3>
            <div className="form-grid">
              <Input
                label="اسم المدينة"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: طرابلس"
                required
              />
            </div>
          </section>
        </div>
      </FormCard>
    </div>
  );
}

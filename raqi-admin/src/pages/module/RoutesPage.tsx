import { FormEvent, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type { Area, City, Route } from '../../types';
import { areaLabel, areaNameById, getId } from './shared';

type RoutesPageProps = {
  routes: Route[];
  areas: Area[];
  cities: City[];
  loading?: boolean;
  onCreate: (body: { name: string; areaId: string; stops?: string[] }) => Promise<void>;
};

const emptyForm = {
  name: '',
  areaId: '',
  stops: '',
};

function parseStops(value: string) {
  return value
    .split(/[,،\n]/)
    .map((stop) => stop.trim())
    .filter(Boolean);
}

export function RoutesPage({ routes, areas, cities, loading = false, onCreate }: RoutesPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Route | null>(null);
  const [saving, setSaving] = useState(false);

  const tableRows = useMemo(
    () =>
      routes.map((route) => {
        const stops = route.stops ?? [];
        return {
          ...route,
          areaName: areaNameById(areas, route.areaId),
          stopsCount: stops.length ? `${stops.length} محطة` : '—',
          stopsPreview: stops.length ? stops.slice(0, 2).join('، ') : '—',
        };
      }),
    [areas, routes],
  );

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.areaId) return;
    const stops = parseStops(form.stops);

    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        areaId: form.areaId,
        stops: stops.length ? stops : undefined,
      });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  const selectedStops = selected?.stops ?? [];

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة مسار"
        description="أنشئ مسار جمع جديد واربطه بمنطقة خدمة ومحطات التوقف"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="اسم المسار"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: مسار حي الأندلس"
            required
          />
          <Select
            label={COMMON.area}
            value={form.areaId}
            onChange={(e) => setForm({ ...form, areaId: e.target.value })}
            required
            disabled={!areas.length}
          >
            <option value="">{COMMON.selectArea}</option>
            {areas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {areaLabel(area, cities)}
              </option>
            ))}
          </Select>
          <div className="form-grid__full">
            <label className="field">
              <span className="field__label">محطات التوقف</span>
              <textarea
                className="field__textarea"
                value={form.stops}
                onChange={(e) => setForm({ ...form, stops: e.target.value })}
                placeholder="مثال: شارع الجمهورية، سوق الخضار، المدرسة"
                rows={3}
              />
              <span className="field__hint">افصل بين المحطات بفاصلة أو سطر جديد (اختياري)</span>
            </label>
          </div>
        </div>
        {!areas.length ? (
          <p className="field__hint">أضف مناطق من صفحة المدن والمناطق قبل إنشاء مسار.</p>
        ) : null}
      </FormCard>

      <DataTable
        title="المسارات"
        description="إدارة مسارات الجمع حسب المنطقة ومحطات التوقف"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['name', 'areaName', 'stopsPreview', 'stopsCount']}
        columns={[
          { key: 'name', label: 'اسم المسار' },
          { key: 'areaName', label: COMMON.area },
          { key: 'stopsCount', label: 'المحطات' },
          { key: 'stopsPreview', label: 'معاينة' },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تفاصيل المسار"
          subtitle={selected.name}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات المسار</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>{COMMON.area}</dt>
                  <dd>{areaNameById(areas, selected.areaId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>عدد المحطات</dt>
                  <dd>{selectedStops.length}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">محطات التوقف</h4>
              {selectedStops.length === 0 ? (
                <p className="detail-block__muted">لا توجد محطات مسجّلة لهذا المسار.</p>
              ) : (
                <ol className="stops-list">
                  {selectedStops.map((stop, index) => (
                    <li key={`${stop}-${index}`} className="stops-list__item">
                      <span className="stops-list__index">{index + 1}</span>
                      <span>{stop}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

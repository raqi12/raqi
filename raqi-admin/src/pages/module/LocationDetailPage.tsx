import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COMMON } from '../../i18n/ar';
import type { Area, City } from '../../types';
import { getId } from './shared';

type LocationDetailPageProps = {
  cities: City[];
  areas: Area[];
  onUpdateCity: (id: string, body: { name: string }) => Promise<void>;
  onDeleteCity: (id: string) => Promise<void>;
  onCreateArea: (body: { name: string; cityId: string }) => Promise<void>;
  onUpdateArea: (id: string, body: { name?: string; cityId?: string }) => Promise<void>;
  onDeleteArea: (id: string) => Promise<void>;
};

type DeleteTarget =
  | { type: 'city'; id: string; label: string }
  | { type: 'area'; id: string; label: string };

export function LocationDetailPage({
  cities,
  areas,
  onUpdateCity,
  onDeleteCity,
  onCreateArea,
  onUpdateArea,
  onDeleteArea,
}: LocationDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const city = useMemo(() => cities.find((item) => getId(item) === id) ?? null, [cities, id]);
  const cityAreas = useMemo(
    () => areas.filter((area) => area.cityId === id),
    [areas, id],
  );

  const [cityName, setCityName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!city) return;
    setCityName(city.name ?? '');
  }, [city]);

  async function submitCityUpdate(e: FormEvent) {
    e.preventDefault();
    if (!city || !cityName.trim()) return;
    setSaving(true);
    try {
      await onUpdateCity(getId(city), { name: cityName.trim() });
    } finally {
      setSaving(false);
    }
  }

  async function submitCreateArea(e: FormEvent) {
    e.preventDefault();
    if (!city || !newAreaName.trim()) return;
    setSaving(true);
    try {
      await onCreateArea({ name: newAreaName.trim(), cityId: getId(city) });
      setNewAreaName('');
    } finally {
      setSaving(false);
    }
  }

  async function saveAreaEdit(area: Area) {
    if (!editingAreaName.trim()) return;
    setSaving(true);
    try {
      await onUpdateArea(getId(area), { name: editingAreaName.trim() });
      setEditingAreaId(null);
      setEditingAreaName('');
    } finally {
      setSaving(false);
    }
  }

  if (!city) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/locations')}>
          ← العودة إلى المدن والمناطق
        </Button>
        <div className="customer-empty">
          <h2>المدينة غير موجودة</h2>
          <p>تعذر العثور على هذه المدينة أو تم حذفها.</p>
          <Button type="button" onClick={() => navigate('/locations')}>
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
          <Button type="button" variant="ghost" onClick={() => navigate('/locations')}>
            ← العودة إلى المدن والمناطق
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setDeleteTarget({
                type: 'city',
                id: getId(city),
                label: city.name ?? '',
              })
            }
          >
            حذف المدينة
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل المدينة</p>
            <h2 className="customer-detail-hero__title">{city.name || '—'}</h2>
            <div className="customer-detail-hero__meta">
              <span>{cityAreas.length} منطقة</span>
            </div>
          </div>
        </div>
      </header>

      <FormCard
        title="تعديل المدينة"
        description="حدّث اسم المدينة كما يظهر في النظام"
        onSubmit={submitCityUpdate}
        submitLabel="حفظ اسم المدينة"
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="اسم المدينة"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            required
          />
        </div>
      </FormCard>

      <FormCard
        title="إضافة منطقة"
        description={`أضف منطقة جديدة تابعة لمدينة ${city.name}`}
        onSubmit={submitCreateArea}
        submitLabel="إضافة المنطقة"
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="اسم المنطقة"
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            placeholder="مثال: حي الأندلس"
            required
          />
        </div>
      </FormCard>

      <section className="customer-detail-card customer-detail-card--wide">
        <div className="locations-nested__header">
          <h3 className="customer-form-section__title">مناطق {city.name}</h3>
          <span>{cityAreas.length} منطقة</span>
        </div>

        {cityAreas.length === 0 ? (
          <p className="field__hint">لا توجد مناطق في هذه المدينة بعد. أضف أول منطقة أعلاه.</p>
        ) : (
          <ul className="record-list">
            {cityAreas.map((area) => {
              const areaId = getId(area);
              const isEditing = editingAreaId === areaId;
              return (
                <li key={areaId} className="record-list__item">
                  <div className="record-list__header">
                    {isEditing ? (
                      <Input
                        label="اسم المنطقة"
                        value={editingAreaName}
                        onChange={(e) => setEditingAreaName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <strong>{area.name}</strong>
                    )}
                    <div className="locations-table__actions">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            onClick={() => void saveAreaEdit(area)}
                            disabled={saving || !editingAreaName.trim()}
                          >
                            {COMMON.save}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setEditingAreaId(null);
                              setEditingAreaName('');
                            }}
                          >
                            {COMMON.cancel}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            className="btn--icon"
                            onClick={() => {
                              setEditingAreaId(areaId);
                              setEditingAreaName(area.name ?? '');
                            }}
                            title="تعديل المنطقة"
                            aria-label="تعديل المنطقة"
                          >
                            <LuPencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="btn--icon"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'area',
                                id: areaId,
                                label: area.name ?? '',
                              })
                            }
                            title="حذف المنطقة"
                            aria-label="حذف المنطقة"
                          >
                            <LuTrash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'city' ? 'حذف المدينة' : 'حذف المنطقة'}
        description={
          deleteTarget?.type === 'city'
            ? `هل تريد حذف مدينة "${deleteTarget.label}"؟ لا يمكن الحذف إذا كانت تحتوي على مناطق.`
            : `هل تريد حذف منطقة "${deleteTarget?.label}"؟ لا يمكن الحذف إذا كانت مرتبطة بمسارات.`
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const work =
            deleteTarget.type === 'city'
              ? () => onDeleteCity(deleteTarget.id)
              : () => onDeleteArea(deleteTarget.id);
          void work().then(() => {
            setDeleteTarget(null);
            if (deleteTarget.type === 'city') {
              navigate('/locations');
            }
            if (deleteTarget.type === 'area' && editingAreaId === deleteTarget.id) {
              setEditingAreaId(null);
            }
          });
        }}
      />
    </div>
  );
}

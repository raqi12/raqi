import { FormEvent, useMemo, useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useSearch } from '../../contexts/SearchContext';
import { COMMON } from '../../i18n/ar';
import type { Area, City } from '../../types';
import { getId } from './shared';

type LocationsPageProps = {
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onCreateCity: (body: { name: string }) => Promise<void>;
  onUpdateCity: (id: string, body: { name: string }) => Promise<void>;
  onDeleteCity: (id: string) => Promise<void>;
  onCreateArea: (body: { name: string; cityId: string }) => Promise<void>;
  onUpdateArea: (id: string, body: { name?: string; cityId?: string }) => Promise<void>;
  onDeleteArea: (id: string) => Promise<void>;
};

type DeleteTarget =
  | { type: 'city'; id: string; label: string }
  | { type: 'area'; id: string; label: string };

function areasForCity(areas: Area[], cityId: string) {
  return areas.filter((area) => area.cityId === cityId);
}

export function LocationsPage({
  cities,
  areas,
  loading = false,
  onCreateCity,
  onUpdateCity,
  onDeleteCity,
  onCreateArea,
  onUpdateArea,
  onDeleteArea,
}: LocationsPageProps) {
  const { query } = useSearch();
  const [cityName, setCityName] = useState('');
  const [expandedCityIds, setExpandedCityIds] = useState<string[]>([]);
  const [newAreaNames, setNewAreaNames] = useState<Record<string, string>>({});
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [saving, setSaving] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const visibleCities = useMemo(() => {
    if (!normalizedQuery) return cities;
    return cities.filter((city) => {
      const cityId = getId(city);
      const cityMatch = String(city.name ?? '').toLowerCase().includes(normalizedQuery);
      const areaMatch = areasForCity(areas, cityId).some((area) =>
        String(area.name ?? '').toLowerCase().includes(normalizedQuery),
      );
      return cityMatch || areaMatch;
    });
  }, [areas, cities, normalizedQuery]);

  const expandedSet = useMemo(() => {
    const set = new Set(expandedCityIds);
    if (normalizedQuery) {
      visibleCities.forEach((city) => {
        const cityId = getId(city);
        const hasAreaMatch = areasForCity(areas, cityId).some((area) =>
          String(area.name ?? '').toLowerCase().includes(normalizedQuery),
        );
        if (hasAreaMatch) set.add(cityId);
      });
    }
    return set;
  }, [areas, expandedCityIds, normalizedQuery, visibleCities]);

  function toggleCity(cityId: string) {
    setExpandedCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId],
    );
  }

  async function submitCreateCity(e: FormEvent) {
    e.preventDefault();
    if (!cityName.trim()) return;
    setSaving(true);
    try {
      await onCreateCity({ name: cityName.trim() });
      setCityName('');
    } finally {
      setSaving(false);
    }
  }

  async function submitCreateArea(cityId: string) {
    const name = newAreaNames[cityId]?.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onCreateArea({ name, cityId });
      setNewAreaNames((prev) => ({ ...prev, [cityId]: '' }));
      setExpandedCityIds((prev) => (prev.includes(cityId) ? prev : [...prev, cityId]));
    } finally {
      setSaving(false);
    }
  }

  async function saveCityEdit(cityId: string) {
    if (!editingCityName.trim()) return;
    setSaving(true);
    try {
      await onUpdateCity(cityId, { name: editingCityName.trim() });
      setEditingCityId(null);
      setEditingCityName('');
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

  function startEditCity(city: City) {
    setEditingCityId(getId(city));
    setEditingCityName(city.name ?? '');
    setEditingAreaId(null);
  }

  function startEditArea(area: Area) {
    setEditingAreaId(getId(area));
    setEditingAreaName(area.name ?? '');
    setEditingCityId(null);
  }

  return (
    <div className="locations-page">
      <section className="table-section locations-page__section">
        <header className="table-section__header">
          <div>
            <h2 className="table-section__title">المدن والمناطق</h2>
            <p className="table-section__description">
              جدول المدن مع المناطق التابعة لكل مدينة في جدول فرعي
            </p>
          </div>
          <span className="table-section__count">
            {visibleCities.length} مدينة · {areas.length} منطقة
          </span>
        </header>

        <form className="locations-toolbar" onSubmit={submitCreateCity}>
          <input
            className="input locations-toolbar__input"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="اسم المدينة الجديدة، مثال: طرابلس"
            aria-label="اسم المدينة"
          />
          <Button type="submit" disabled={saving || !cityName.trim()}>
            <LuPlus aria-hidden="true" />
            إضافة مدينة
          </Button>
        </form>

        <div className="table-wrap">
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : visibleCities.length === 0 ? (
            <EmptyState
              title={normalizedQuery ? COMMON.noResults : 'لا توجد مدن'}
              description={
                normalizedQuery
                  ? COMMON.trySearch
                  : 'أضف مدينة من الشريط أعلاه ثم أضف المناطق داخلها'
              }
            />
          ) : (
            <table className="data-table locations-table">
              <thead>
                <tr>
                  <th className="locations-table__expand-col" aria-label="توسيع" />
                  <th scope="col">المدينة</th>
                  <th scope="col" className="data-table__cell--center">
                    عدد المناطق
                  </th>
                  <th scope="col" className="data-table__cell--end">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCities.map((city) => {
                  const cityId = getId(city);
                  const cityAreas = areasForCity(areas, cityId);
                  const isExpanded = expandedSet.has(cityId);
                  const isEditingCity = editingCityId === cityId;

                  return (
                    <CityRows
                      key={cityId}
                      city={city}
                      cityAreas={cityAreas}
                      isExpanded={isExpanded}
                      isEditingCity={isEditingCity}
                      editingCityName={editingCityName}
                      editingAreaId={editingAreaId}
                      editingAreaName={editingAreaName}
                      newAreaName={newAreaNames[cityId] ?? ''}
                      saving={saving}
                      normalizedQuery={normalizedQuery}
                      onToggle={() => toggleCity(cityId)}
                      onEditCity={() => startEditCity(city)}
                      onCancelEditCity={() => setEditingCityId(null)}
                      onChangeEditingCityName={setEditingCityName}
                      onSaveCity={() => void saveCityEdit(cityId)}
                      onDeleteCity={() =>
                        setDeleteTarget({ type: 'city', id: cityId, label: city.name ?? '' })
                      }
                      onChangeNewAreaName={(value) =>
                        setNewAreaNames((prev) => ({ ...prev, [cityId]: value }))
                      }
                      onCreateArea={() => void submitCreateArea(cityId)}
                      onEditArea={startEditArea}
                      onCancelEditArea={() => setEditingAreaId(null)}
                      onChangeEditingAreaName={setEditingAreaName}
                      onSaveArea={saveAreaEdit}
                      onDeleteArea={(area) =>
                        setDeleteTarget({
                          type: 'area',
                          id: getId(area),
                          label: area.name ?? '',
                        })
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
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
            if (deleteTarget.type === 'city') {
              setExpandedCityIds((prev) => prev.filter((id) => id !== deleteTarget.id));
              if (editingCityId === deleteTarget.id) setEditingCityId(null);
            }
            if (deleteTarget.type === 'area' && editingAreaId === deleteTarget.id) {
              setEditingAreaId(null);
            }
            setDeleteTarget(null);
          });
        }}
      />
    </div>
  );
}

type CityRowsProps = {
  city: City;
  cityAreas: Area[];
  isExpanded: boolean;
  isEditingCity: boolean;
  editingCityName: string;
  editingAreaId: string | null;
  editingAreaName: string;
  newAreaName: string;
  saving: boolean;
  normalizedQuery: string;
  onToggle: () => void;
  onEditCity: () => void;
  onCancelEditCity: () => void;
  onChangeEditingCityName: (value: string) => void;
  onSaveCity: () => void;
  onDeleteCity: () => void;
  onChangeNewAreaName: (value: string) => void;
  onCreateArea: () => void;
  onEditArea: (area: Area) => void;
  onCancelEditArea: () => void;
  onChangeEditingAreaName: (value: string) => void;
  onSaveArea: (area: Area) => void;
  onDeleteArea: (area: Area) => void;
};

function CityRows({
  city,
  cityAreas,
  isExpanded,
  isEditingCity,
  editingCityName,
  editingAreaId,
  editingAreaName,
  newAreaName,
  saving,
  normalizedQuery,
  onToggle,
  onEditCity,
  onCancelEditCity,
  onChangeEditingCityName,
  onSaveCity,
  onDeleteCity,
  onChangeNewAreaName,
  onCreateArea,
  onEditArea,
  onCancelEditArea,
  onChangeEditingAreaName,
  onSaveArea,
  onDeleteArea,
}: CityRowsProps) {
  const visibleAreas = normalizedQuery
    ? cityAreas.filter((area) =>
        String(area.name ?? '').toLowerCase().includes(normalizedQuery),
      )
    : cityAreas;

  return (
    <>
      <tr className="locations-table__city-row">
        <td className="locations-table__expand-col">
          <button
            type="button"
            className="locations-table__expand-btn"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'طي المناطق' : 'عرض المناطق'}
          >
            {isExpanded ? <LuChevronDown /> : <LuChevronLeft />}
          </button>
        </td>
        <td>
          {isEditingCity ? (
            <input
              className="input locations-table__inline-input"
              value={editingCityName}
              onChange={(e) => onChangeEditingCityName(e.target.value)}
              autoFocus
            />
          ) : (
            <span className="locations-table__city-name">{city.name}</span>
          )}
        </td>
        <td className="data-table__cell--center">{cityAreas.length}</td>
        <td className="data-table__cell--end">
          <div className="locations-table__actions">
            {isEditingCity ? (
              <>
                <Button type="button" variant="primary" onClick={onSaveCity} disabled={saving}>
                  {COMMON.save}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancelEditCity}>
                  {COMMON.cancel}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="btn--icon"
                  onClick={onEditCity}
                  title="تعديل المدينة"
                  aria-label="تعديل المدينة"
                >
                  <LuPencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="btn--icon"
                  onClick={onDeleteCity}
                  title="حذف المدينة"
                  aria-label="حذف المدينة"
                >
                  <LuTrash2 />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>

      {isExpanded ? (
        <tr className="locations-table__nested-row">
          <td colSpan={4}>
            <div className="locations-nested">
              <div className="locations-nested__header">
                <h3>مناطق {city.name}</h3>
                <span>{visibleAreas.length} منطقة</span>
              </div>

              <table className="data-table locations-nested__table">
                <thead>
                  <tr>
                    <th scope="col">المنطقة</th>
                    <th scope="col" className="data-table__cell--end">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAreas.length === 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <p className="locations-nested__empty">لا توجد مناطق في هذه المدينة بعد</p>
                      </td>
                    </tr>
                  ) : (
                    visibleAreas.map((area) => {
                      const areaId = getId(area);
                      const isEditingArea = editingAreaId === areaId;
                      return (
                        <tr key={areaId}>
                          <td>
                            {isEditingArea ? (
                              <input
                                className="input locations-table__inline-input"
                                value={editingAreaName}
                                onChange={(e) => onChangeEditingAreaName(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              area.name
                            )}
                          </td>
                          <td className="data-table__cell--end">
                            <div className="locations-table__actions">
                              {isEditingArea ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => void onSaveArea(area)}
                                    disabled={saving}
                                  >
                                    {COMMON.save}
                                  </Button>
                                  <Button type="button" variant="ghost" onClick={onCancelEditArea}>
                                    {COMMON.cancel}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="btn--icon"
                                    onClick={() => onEditArea(area)}
                                    title="تعديل المنطقة"
                                    aria-label="تعديل المنطقة"
                                  >
                                    <LuPencil />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="btn--icon"
                                    onClick={() => onDeleteArea(area)}
                                    title="حذف المنطقة"
                                    aria-label="حذف المنطقة"
                                  >
                                    <LuTrash2 />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="locations-nested__add-row">
                    <td>
                      <input
                        className="input locations-table__inline-input"
                        value={newAreaName}
                        onChange={(e) => onChangeNewAreaName(e.target.value)}
                        placeholder="اسم المنطقة الجديدة"
                        aria-label={`إضافة منطقة في ${city.name}`}
                      />
                    </td>
                    <td className="data-table__cell--end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onCreateArea}
                        disabled={saving || !newAreaName.trim()}
                      >
                        <LuPlus aria-hidden="true" />
                        إضافة منطقة
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

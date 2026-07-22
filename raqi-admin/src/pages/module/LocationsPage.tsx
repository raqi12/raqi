import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import type { Area, City } from '../../types';
import { getId } from './shared';

type LocationsPageProps = {
  cities: City[];
  areas: Area[];
  loading?: boolean;
};

function areasForCity(areas: Area[], cityId: string) {
  return areas.filter((area) => area.cityId === cityId);
}

export function LocationsPage({
  cities,
  areas,
  loading = false,
}: LocationsPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      cities.map((city) => {
        const cityId = getId(city);
        const cityAreas = areasForCity(areas, cityId);
        return {
          ...city,
          id: cityId,
          areasCount: cityAreas.length,
          areasLabel: cityAreas.length
            ? cityAreas.map((area) => area.name).filter(Boolean).join(' · ')
            : 'لا توجد مناطق',
        };
      }),
    [areas, cities],
  );

  const emptyCities = tableRows.filter((row) => row.areasCount === 0).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">المدن والمناطق</h2>
          <p className="page-header__description">
            إدارة المدن والمناطق التابعة لكل مدينة
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/locations/new')}>
          إضافة مدينة
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">المدن</span>
          <strong className="customers-stat__value">{cities.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">المناطق</span>
          <strong className="customers-stat__value">{areas.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">بدون مناطق</span>
          <strong className="customers-stat__value">{emptyCities}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة المدن"
        description="اضغط على صف لفتح المدينة وإدارة مناطقها"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/locations/${getId(row)}`)}
        searchKeys={['name', 'areasLabel']}
        columns={[
          { key: 'name', label: 'المدينة' },
          {
            key: 'areasCount',
            label: 'عدد المناطق',
            render: (row) => String(row.areasCount ?? 0),
          },
          {
            key: 'areasLabel',
            label: 'المناطق',
            render: (row) => (
              <span className="muted">{String(row.areasLabel ?? '—')}</span>
            ),
            sortable: false,
          },
        ]}
      />
    </div>
  );
}

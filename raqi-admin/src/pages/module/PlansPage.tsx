import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Plan } from '../../types';
import { getId } from './shared';
import {
  formatPlanPrice,
  planActivityLabel,
  planFrequencyLabel,
  planStatusKey,
} from './planUi';

type PlansPageProps = {
  plans: Plan[];
  loading?: boolean;
};

export function PlansPage({ plans, loading = false }: PlansPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        activityTypeLabel: planActivityLabel(plan.activityType),
        frequencyLabel: planFrequencyLabel(plan.frequency),
        priceLabel: formatPlanPrice(plan.price),
        durationLabel: plan.durationDays != null ? `${plan.durationDays} يوم` : '—',
        collectionsLabel:
          plan.numberOfCollections != null ? `${plan.numberOfCollections} جولة` : '—',
        statusKey: planStatusKey(plan),
      })),
    [plans],
  );

  const activeCount = plans.filter((p) => p.active !== false).length;
  const inactiveCount = plans.filter((p) => p.active === false).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">الخطط</h2>
          <p className="page-header__description">
            إدارة خطط الاشتراك المتاحة للعملاء حسب نوع النشاط والسعر والجولات
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/plans/new')}>
          إضافة خطة
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{plans.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">غير نشط</span>
          <strong className="customers-stat__value">{inactiveCount}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة الخطط"
        description="اضغط على صف لفتح صفحة التفاصيل"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/plans/${getId(row)}`)}
        searchKeys={[
          'name',
          'activityTypeLabel',
          'frequencyLabel',
          'priceLabel',
          'durationLabel',
          'collectionsLabel',
        ]}
        columns={[
          { key: 'name', label: 'اسم الخطة' },
          { key: 'activityTypeLabel', label: COMMON.type },
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
    </div>
  );
}

import type { Overview } from '../types';
import { KpiStat } from '../components/ui/KpiStat';
import { KpiSkeleton } from '../components/ui/Skeleton';
import { PageSection } from '../components/ui/PageSection';

type OverviewPageProps = {
  overview: Overview | null;
  usersCount: number;
  customersCount: number;
  driversCount: number;
  tasksCount: number;
  subscriptionsCount: number;
  paymentsCount: number;
  complaintsCount: number;
  binsStats: { availableBins?: number } | null;
  pendingDeposits: number;
  activityItems: string[];
  loading?: boolean;
};

export function OverviewPage({
  overview,
  customersCount,
  driversCount,
  complaintsCount,
  binsStats,
  pendingDeposits,
  activityItems,
  loading = false,
}: OverviewPageProps) {
  const primary = [
    {
      label: 'الاشتراكات النشطة',
      value: overview?.activeSubscriptions ?? '—',
      hint: 'اشتراكات فعّالة حاليًا',
      trend: overview ? '+نشط' : undefined,
      trendDirection: 'up' as const,
    },
    {
      label: 'إجمالي الإيرادات',
      value: overview?.totalRevenue ?? '—',
      hint: 'إجمالي المدفوعات المسجلة',
      trend: overview ? 'إجمالي' : undefined,
      trendDirection: 'neutral' as const,
    },
    {
      label: 'طلبات إيداع معلقة',
      value: pendingDeposits,
      hint: 'بانتظار المراجعة',
      tone: pendingDeposits > 0 ? ('warning' as const) : ('default' as const),
      trend: pendingDeposits > 0 ? 'يتطلب إجراء' : 'لا يوجد',
      trendDirection: pendingDeposits > 0 ? ('down' as const) : ('neutral' as const),
    },
    {
      label: 'المهام المكتملة',
      value: overview?.completedTasks ?? '—',
      hint: 'منذ بداية التشغيل',
      trend: overview ? 'مكتمل' : undefined,
      trendDirection: 'up' as const,
    },
  ];

  const secondary = [
    { label: 'العملاء', value: customersCount, hint: 'إجمالي العملاء المسجلين' },
    { label: 'السائقون', value: driversCount, hint: 'سائقون نشطون' },
    { label: 'الصناديق المتاحة', value: binsStats?.availableBins ?? '—', hint: 'جاهزة للتخصيص' },
    { label: 'الشكاوى المفتوحة', value: complaintsCount, hint: 'تحتاج متابعة' },
  ];

  return (
    <div className="overview-page">
      <header className="page-header">
        <div>
          <h2 className="page-header__title">نظرة تنفيذية</h2>
          <p className="page-header__description">
            ملخص سريع لأهم مؤشرات الأداء والعمليات اليومية
          </p>
        </div>
      </header>

      <section className="kpi-grid kpi-grid--primary" aria-label="المؤشرات الرئيسية">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : primary.map((item) => <KpiStat key={item.label} {...item} />)}
      </section>

      <section className="kpi-grid kpi-grid--secondary" aria-label="مؤشرات تشغيلية">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : secondary.map((item) => <KpiStat key={item.label} {...item} hint={item.hint} />)}
      </section>

      <PageSection
        title="آخر النشاط"
        description="أحدث العمليات الإدارية على المنصة"
        className="overview-activity"
      >
        {activityItems.length === 0 ? (
          <p className="muted">لا يوجد نشاط حديث بعد.</p>
        ) : (
          <ul className="activity-list">
            {activityItems.map((item) => (
              <li key={item}>
                <span className="activity-list__dot" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}

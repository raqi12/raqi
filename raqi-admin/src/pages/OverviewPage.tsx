import { KpiStat } from '../components/ui/KpiStat';
import { PageSection } from '../components/ui/PageSection';
import type { BinStats, Overview } from '../types';

type OverviewPageProps = {
  overview: Overview | null;
  usersCount: number;
  customersCount: number;
  driversCount: number;
  tasksCount: number;
  subscriptionsCount: number;
  paymentsCount: number;
  complaintsCount: number;
  binsStats: BinStats | null;
  pendingDeposits: number;
  activityItems: string[];
};

export function OverviewPage(props: OverviewPageProps) {
  const primary = [
    {
      label: 'الاشتراكات النشطة',
      value: props.overview?.activeSubscriptions ?? '—',
      hint: 'اشتراكات فعّالة حاليًا',
    },
    {
      label: 'إجمالي الإيرادات',
      value: props.overview?.totalRevenue ?? '—',
      hint: 'إجمالي المدفوعات المسجلة',
    },
    {
      label: 'طلبات إيداع معلقة',
      value: props.pendingDeposits,
      hint: 'بانتظار المراجعة',
      tone: props.pendingDeposits > 0 ? ('warning' as const) : ('default' as const),
    },
    {
      label: 'المهام المكتملة',
      value: props.overview?.completedTasks ?? '—',
      hint: 'منذ بداية التشغيل',
    },
  ];

  const secondary = [
    { label: 'العملاء', value: props.customersCount },
    { label: 'السائقون', value: props.driversCount },
    { label: 'الصناديق المتاحة', value: props.binsStats?.availableBins ?? '—' },
    { label: 'الشكاوى المفتوحة', value: props.complaintsCount },
  ];

  return (
    <div className="page-stack">
      <section className="kpi-grid kpi-grid--primary" aria-label="المؤشرات الرئيسية">
        {primary.map((item) => (
          <KpiStat
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            tone={item.tone}
          />
        ))}
      </section>

      <section className="kpi-grid kpi-grid--secondary" aria-label="مؤشرات تشغيلية">
        {secondary.map((item) => (
          <KpiStat key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      {props.activityItems.length > 0 ? (
        <PageSection title="آخر النشاط" description="أحدث العمليات الإدارية">
          <ul className="activity-list">
            {props.activityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </PageSection>
      ) : null}
    </div>
  );
}

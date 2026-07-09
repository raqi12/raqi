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
};

export function OverviewPage(props: OverviewPageProps) {
  const cards = [
    { label: 'الاشتراكات النشطة', value: props.overview?.activeSubscriptions ?? '-' },
    { label: 'المهام المكتملة', value: props.overview?.completedTasks ?? '-' },
    { label: 'إجمالي الإيرادات', value: props.overview?.totalRevenue ?? '-' },
    { label: 'طلبات إيداع معلقة', value: props.pendingDeposits },
    { label: 'المستخدمون', value: props.usersCount },
    { label: 'العملاء', value: props.customersCount },
    { label: 'السائقون', value: props.driversCount },
    { label: 'المهام', value: props.tasksCount },
    { label: 'الاشتراكات', value: props.subscriptionsCount },
    { label: 'المدفوعات', value: props.paymentsCount },
    { label: 'الشكاوى', value: props.complaintsCount },
    { label: 'الصناديق', value: props.binsStats?.totalBins ?? '-' },
    { label: 'سعة الصناديق', value: props.binsStats?.totalCapacity ?? '-' },
    { label: 'صناديق متاحة', value: props.binsStats?.availableBins ?? '-' },
  ];

  return (
    <section className="grid">
      {cards.map((card) => (
        <article key={card.label} className="card">
          <h3>{card.label}</h3>
          <p className="kpi">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

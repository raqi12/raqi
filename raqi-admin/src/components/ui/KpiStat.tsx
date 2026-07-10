type KpiStatProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export function KpiStat({
  label,
  value,
  hint,
  trend,
  trendDirection = 'neutral',
  tone = 'default',
}: KpiStatProps) {
  return (
    <article className={`kpi-stat kpi-stat--${tone}`}>
      <p className="kpi-stat__label">{label}</p>
      <div className="kpi-stat__row">
        <p className="kpi-stat__value">{value}</p>
        {trend ? (
          <span className={`kpi-stat__trend kpi-stat__trend--${trendDirection}`}>{trend}</span>
        ) : null}
      </div>
      {hint ? <p className="kpi-stat__hint">{hint}</p> : null}
    </article>
  );
}

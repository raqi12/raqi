type KpiStatProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export function KpiStat({ label, value, hint, tone = 'default' }: KpiStatProps) {
  return (
    <article className={`kpi-stat kpi-stat--${tone}`}>
      <p className="kpi-stat__label">{label}</p>
      <p className="kpi-stat__value">{value}</p>
      {hint ? <p className="kpi-stat__hint">{hint}</p> : null}
    </article>
  );
}

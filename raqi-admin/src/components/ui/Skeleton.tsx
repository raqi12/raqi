type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-skeleton" aria-label="جاري التحميل">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="table-skeleton__row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, col) => (
            <Skeleton key={col} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi-stat kpi-stat--skeleton" aria-hidden="true">
      <Skeleton height={12} width="40%" />
      <Skeleton height={32} width="55%" className="kpi-stat__value-skeleton" />
      <Skeleton height={12} width="70%" />
    </div>
  );
}

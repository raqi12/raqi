type DataTableProps<T> = {
  title: string;
  rows: T[];
  columns: Array<{ key: string; label: string; render?: (row: T) => string }>;
  onSelect?: (row: T) => void;
};

export function DataTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  onSelect,
}: DataTableProps<T>) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={String(row._id ?? row.id ?? idx)} onClick={() => onSelect?.(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '-')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useMemo } from 'react';
import { useSearch, filterRows } from '../contexts/SearchContext';
import { EmptyState } from './ui/EmptyState';

type DataTableProps<T> = {
  title: string;
  description?: string;
  rows: T[];
  columns: Array<{ key: string; label: string; render?: (row: T) => string }>;
  onSelect?: (row: T) => void;
  searchKeys?: string[];
};

export function DataTable<T extends Record<string, unknown>>({
  title,
  description,
  rows,
  columns,
  onSelect,
  searchKeys,
}: DataTableProps<T>) {
  const { query } = useSearch();
  const filteredRows = useMemo(
    () => filterRows(rows, query, searchKeys),
    [rows, query, searchKeys],
  );

  return (
    <section className="section table-section">
      <header className="section__header">
        <div>
          <h2 className="section__title">{title}</h2>
          {description ? <p className="section__description">{description}</p> : null}
        </div>
        <span className="table-section__count">{filteredRows.length} سجل</span>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title="لا توجد نتائج"
                    description={query ? 'جرّب تعديل كلمات البحث.' : 'لم يتم إضافة بيانات بعد.'}
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={String(row._id ?? row.id ?? idx)}
                  onClick={() => onSelect?.(row)}
                  tabIndex={onSelect ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelect(row);
                    }
                  }}
                  className={onSelect ? 'data-table__row--selectable' : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '—')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

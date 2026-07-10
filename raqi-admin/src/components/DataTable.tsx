import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useSearch, filterRows } from '../contexts/SearchContext';
import { COMMON } from '../i18n/ar';
import { EmptyState } from './ui/EmptyState';
import { TableSkeleton } from './ui/Skeleton';

const PAGE_SIZE = 12;

type SortDir = 'asc' | 'desc';

type DataTableProps<T> = {
  title: string;
  description?: string;
  rows: T[];
  columns: Array<{
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    sortable?: boolean;
    align?: 'start' | 'end' | 'center';
  }>;
  onSelect?: (row: T) => void;
  searchKeys?: string[];
  loading?: boolean;
};

function getSortValue<T extends Record<string, unknown>>(row: T, key: string) {
  return String(row[key] ?? '');
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  description,
  rows,
  columns,
  onSelect,
  searchKeys,
  loading = false,
}: DataTableProps<T>) {
  const { query } = useSearch();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(
    () => filterRows(rows, query, searchKeys),
    [rows, query, searchKeys],
  );

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      const cmp = av.localeCompare(bv, 'ar', { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [columns, filteredRows, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
    setPage(1);
  }

  return (
    <section className="table-section">
      <header className="table-section__header">
        <div>
          <h2 className="table-section__title">{title}</h2>
          {description ? <p className="table-section__description">{description}</p> : null}
        </div>
        <span className="table-section__count">
          {filteredRows.length} {COMMON.records}
        </span>
      </header>

      <div className="table-wrap">
        {loading ? (
          <TableSkeleton rows={6} cols={columns.length} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={col.align ? `data-table__cell--${col.align}` : undefined}
                  >
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        className="data-table__sort"
                        onClick={() => toggleSort(col.key)}
                        aria-label={`ترتيب حسب ${col.label}`}
                      >
                        <span>{col.label}</span>
                        <span className="data-table__sort-icon" aria-hidden="true">
                          {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      title={COMMON.noResults}
                      description={query ? COMMON.trySearch : COMMON.noData}
                    />
                  </td>
                </tr>
              ) : (
                pageRows.map((row, idx) => (
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
                      <td
                        key={col.key}
                        className={col.align ? `data-table__cell--${col.align}` : undefined}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && sortedRows.length > PAGE_SIZE ? (
        <footer className="table-pagination">
          <span className="table-pagination__info">
            صفحة {currentPage} من {totalPages}
          </span>
          <div className="table-pagination__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}

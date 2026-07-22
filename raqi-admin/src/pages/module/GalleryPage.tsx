import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { GalleryItem } from '../../types';
import { API_ORIGIN, getId } from './shared';

type GalleryPageProps = {
  items: GalleryItem[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
};

export function GalleryPage({ items, loading = false, onDelete }: GalleryPageProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      [...items]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item) => ({
          ...item,
          statusLabel: item.active ? 'نشط' : 'غير نشط',
          previewUrl: item.imageUrl ? `${API_ORIGIN}${item.imageUrl}` : '',
        })),
    [items],
  );

  const activeCount = items.filter((item) => item.active !== false).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">معرض الصور</h2>
          <p className="page-header__description">
            إدارة صور المعرض المعروضة للعملاء والسائقين
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/gallery/new')}>
          إضافة عنصر
        </Button>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{items.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">غير نشط</span>
          <strong className="customers-stat__value">{items.length - activeCount}</strong>
        </div>
      </div>

      <DataTable
        title="عناصر المعرض"
        description="اضغط على صف لفتح صفحة التعديل"
        rows={rows}
        loading={loading}
        onSelect={(row) => navigate(`/gallery/${getId(row)}`)}
        searchKeys={['title', 'caption', 'statusLabel']}
        columns={[
          { key: 'sortOrder', label: 'الترتيب' },
          {
            key: 'imageUrl',
            label: 'الصورة',
            sortable: false,
            render: (row) =>
              row.previewUrl ? (
                <img
                  src={String(row.previewUrl)}
                  alt={String(row.title ?? '')}
                  className="gallery-thumb"
                />
              ) : (
                '—'
              ),
          },
          { key: 'title', label: 'العنوان' },
          { key: 'caption', label: 'الوصف' },
          {
            key: 'statusLabel',
            label: COMMON.status,
            render: (row) => (
              <StatusBadge status={row.active ? 'active' : 'inactive'} />
            ),
            sortable: false,
          },
          {
            key: 'actions',
            label: COMMON.actions,
            sortable: false,
            render: (row) => (
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(getId(row));
                }}
              >
                {COMMON.delete}
              </Button>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="حذف عنصر المعرض"
        description="هل أنت متأكد من حذف هذا العنصر؟"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void onDelete(deleteId).then(() => setDeleteId(null));
        }}
      />
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COMMON } from '../../i18n/ar';
import type { GalleryItem } from '../../types';
import { API_ORIGIN, getId } from './shared';

type GalleryForm = {
  title: string;
  imageUrl: string;
  caption: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
};

type GalleryPageProps = {
  items: GalleryItem[];
  loading?: boolean;
  onCreate: (body: GalleryForm) => Promise<void>;
  onCreateWithImage: (formData: FormData) => Promise<void>;
  onUpdate: (id: string, body: Partial<GalleryForm>) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
};

const emptyForm = (sortOrder = 0): GalleryForm => ({
  title: '',
  imageUrl: '',
  caption: '',
  linkUrl: '',
  sortOrder,
  active: true,
});

export function GalleryPage({
  items,
  loading = false,
  onCreate,
  onCreateWithImage,
  onUpdate,
  onUpload,
  onDelete,
}: GalleryPageProps) {
  const [form, setForm] = useState<GalleryForm>(emptyForm(items.length));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewObjectUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({ ...prev, sortOrder: items.length }));
    }
  }, [items.length, editingId]);

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

  const resetForm = () => {
    setEditingId(null);
    setImageFile(null);
    setForm(emptyForm(items.length));
  };

  const startEdit = (item: GalleryItem) => {
    setEditingId(getId(item));
    setImageFile(null);
    setForm({
      title: item.title ?? '',
      imageUrl: item.imageUrl ?? '',
      caption: item.caption ?? '',
      linkUrl: item.linkUrl ?? '',
      sortOrder: item.sortOrder ?? 0,
      active: item.active ?? true,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        let imageUrl = form.imageUrl.trim();
        if (imageFile) {
          imageUrl = await onUpload(imageFile);
        }
        if (!imageUrl) return;
        await onUpdate(editingId, {
          title: form.title.trim(),
          imageUrl,
          caption: form.caption.trim(),
          linkUrl: form.linkUrl.trim(),
          sortOrder: form.sortOrder,
          active: form.active,
        });
        resetForm();
        return;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', form.title.trim());
        if (form.caption.trim()) formData.append('caption', form.caption.trim());
        if (form.linkUrl.trim()) formData.append('linkUrl', form.linkUrl.trim());
        formData.append('sortOrder', String(form.sortOrder));
        formData.append('active', String(form.active));
        await onCreateWithImage(formData);
        resetForm();
        return;
      }

      if (!form.imageUrl.trim()) return;
      await onCreate({
        ...form,
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        caption: form.caption.trim(),
        linkUrl: form.linkUrl.trim(),
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>معرض الصور</h2>
        <p className="muted">إدارة صور المعرض المعروضة للعملاء والسائقين.</p>
      </section>

      <section className="panel">
        <h3>{editingId ? 'تعديل عنصر' : 'إضافة عنصر'}</h3>
        <form className="row-form" onSubmit={(e) => void handleSubmit(e)}>
          <Input
            placeholder="العنوان"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="رابط الصورة (اختياري عند رفع ملف)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          {(previewObjectUrl || form.imageUrl) && (
            <div>
              <img
                src={previewObjectUrl ?? `${API_ORIGIN}${form.imageUrl}`}
                alt={form.title || 'معاينة'}
                style={{ maxWidth: 220, maxHeight: 140, objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          )}
          <Input
            placeholder="الوصف"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
          <Input
            placeholder="رابط اختياري"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          />
          <Input
            type="number"
            placeholder="الترتيب"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
          />
          <select
            value={form.active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
          >
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <div className="row-actions">
            <Button type="submit" disabled={loading || saving}>
              {editingId ? COMMON.save : COMMON.create}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                {COMMON.cancel}
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel">
        <DataTable
          title="عناصر المعرض"
          rows={rows}
          columns={[
            { key: 'sortOrder', label: 'الترتيب' },
            {
              key: 'imageUrl',
              label: 'الصورة',
              sortable: false,
              render: (row) =>
                row.previewUrl ? (
                  <img
                    src={row.previewUrl}
                    alt={row.title ?? ''}
                    style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  '—'
                ),
            },
            { key: 'title', label: 'العنوان' },
            { key: 'caption', label: 'الوصف' },
            { key: 'statusLabel', label: COMMON.status },
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
          onSelect={(row) => startEdit(row)}
        />
      </section>

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
    </>
  );
}

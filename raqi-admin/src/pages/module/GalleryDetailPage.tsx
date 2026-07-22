import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { GalleryItem } from '../../types';
import { API_ORIGIN, getId } from './shared';
import type { GalleryForm } from './GalleryCreatePage';

type GalleryDetailPageProps = {
  items: GalleryItem[];
  loading?: boolean;
  onUpdate: (id: string, body: Partial<GalleryForm>) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
};

export function GalleryDetailPage({
  items,
  loading = false,
  onUpdate,
  onUpload,
  onDelete,
}: GalleryDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const item = useMemo(() => items.find((entry) => getId(entry) === id) ?? null, [id, items]);

  const [form, setForm] = useState<GalleryForm>({
    title: '',
    imageUrl: '',
    caption: '',
    linkUrl: '',
    sortOrder: 0,
    active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    if (!item) return;
    setImageFile(null);
    setForm({
      title: item.title ?? '',
      imageUrl: item.imageUrl ?? '',
      caption: item.caption ?? '',
      linkUrl: item.linkUrl ?? '',
      sortOrder: item.sortOrder ?? 0,
      active: item.active ?? true,
    });
  }, [item]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!item || !form.title.trim()) return;

    setSaving(true);
    try {
      let imageUrl = form.imageUrl.trim();
      if (imageFile) {
        imageUrl = await onUpload(imageFile);
      }
      if (!imageUrl) return;
      await onUpdate(getId(item), {
        title: form.title.trim(),
        imageUrl,
        caption: form.caption.trim(),
        linkUrl: form.linkUrl.trim(),
        sortOrder: form.sortOrder,
        active: form.active,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!item) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/gallery')}>
          ← العودة إلى المعرض
        </Button>
        <div className="customer-empty">
          <h2>العنصر غير موجود</h2>
          <p>تعذر العثور على هذا العنصر أو تم حذفه.</p>
          <Button type="button" onClick={() => navigate('/gallery')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  const previewSrc =
    previewObjectUrl ?? (form.imageUrl ? `${API_ORIGIN}${form.imageUrl}` : '');

  return (
    <div className="module-page customer-detail-page">
      <header className="customer-detail-hero">
        <div className="customer-detail-hero__top">
          <Button type="button" variant="ghost" onClick={() => navigate('/gallery')}>
            ← العودة إلى المعرض
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            حذف العنصر
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل عنصر المعرض</p>
            <h2 className="customer-detail-hero__title">{item.title || 'بدون عنوان'}</h2>
            <div className="customer-detail-hero__meta">
              <span>الترتيب: {item.sortOrder ?? 0}</span>
              <StatusBadge status={item.active ? 'active' : 'inactive'} />
            </div>
          </div>
          {item.imageUrl ? (
            <img
              src={`${API_ORIGIN}${item.imageUrl}`}
              alt={item.title ?? ''}
              className="gallery-hero-image"
            />
          ) : null}
        </div>
      </header>

      <FormCard
        title="تعديل العنصر"
        description="حدّث الصورة أو البيانات ثم احفظ التغييرات"
        onSubmit={(e) => void handleSubmit(e)}
        submitLabel="حفظ التغييرات"
        loading={saving || loading}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">المحتوى</h3>
            <div className="form-grid">
              <Input
                label="العنوان"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                label="الوصف"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
              <Input
                label="رابط اختياري"
                dir="ltr"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              />
              <Input
                label="الترتيب"
                type="number"
                dir="ltr"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              />
              <Select
                label="الحالة"
                value={form.active ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </Select>
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">الصورة</h3>
            <div className="form-grid">
              <Input
                label="رفع صورة جديدة"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <Input
                label="رابط الصورة"
                dir="ltr"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            {previewSrc ? (
              <div className="gallery-preview">
                <img src={previewSrc} alt={form.title || 'معاينة'} />
              </div>
            ) : null}
          </section>
        </div>
      </FormCard>

      <ConfirmDialog
        open={deleteOpen}
        title="حذف عنصر المعرض"
        description="هل أنت متأكد من حذف هذا العنصر؟"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          void onDelete(getId(item)).then(() => {
            setDeleteOpen(false);
            navigate('/gallery');
          });
        }}
      />
    </div>
  );
}

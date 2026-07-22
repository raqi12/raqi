import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { GalleryItem } from '../../types';
import { API_ORIGIN, getId } from './shared';

export type GalleryForm = {
  title: string;
  imageUrl: string;
  caption: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
};

type GalleryCreatePageProps = {
  itemCount: number;
  loading?: boolean;
  onCreate: (body: GalleryForm) => Promise<GalleryItem | undefined>;
  onCreateWithImage: (formData: FormData) => Promise<GalleryItem | undefined>;
};

export function GalleryCreatePage({
  itemCount,
  loading = false,
  onCreate,
  onCreateWithImage,
}: GalleryCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<GalleryForm>({
    title: '',
    imageUrl: '',
    caption: '',
    linkUrl: '',
    sortOrder: itemCount,
    active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    setForm((prev) => ({ ...prev, sortOrder: itemCount }));
  }, [itemCount]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      let created: GalleryItem | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', form.title.trim());
        if (form.caption.trim()) formData.append('caption', form.caption.trim());
        if (form.linkUrl.trim()) formData.append('linkUrl', form.linkUrl.trim());
        formData.append('sortOrder', String(form.sortOrder));
        formData.append('active', String(form.active));
        created = await onCreateWithImage(formData);
      } else {
        if (!form.imageUrl.trim()) return;
        created = await onCreate({
          ...form,
          title: form.title.trim(),
          imageUrl: form.imageUrl.trim(),
          caption: form.caption.trim(),
          linkUrl: form.linkUrl.trim(),
        });
      }

      if (created) {
        navigate(`/gallery/${getId(created)}`);
        return;
      }
      navigate('/gallery');
    } finally {
      setSaving(false);
    }
  }

  const previewSrc = previewObjectUrl ?? (form.imageUrl ? `${API_ORIGIN}${form.imageUrl}` : '');

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/gallery')}>
          ← العودة إلى المعرض
        </Button>
        <h2 className="page-header__title">إضافة عنصر</h2>
        <p className="page-header__description">
          أضف صورة جديدة للمعرض مع عنوان ووصف وترتيب العرض
        </p>
      </header>

      <FormCard
        title="بيانات العنصر"
        description="ارفع صورة أو الصق رابط صورة موجود"
        onSubmit={(e) => void handleSubmit(e)}
        submitLabel="إنشاء العنصر"
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
                label="رفع ملف"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <Input
                label="رابط الصورة"
                dir="ltr"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                hint="اختياري عند رفع ملف"
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
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COMMON } from '../../i18n/ar';
import type { ContentPage, ContentPageSlug } from '../../types';

type ContentPageEditorProps = {
  slug: ContentPageSlug;
  heading: string;
  description: string;
  page: ContentPage | null;
  loading?: boolean;
  onSave: (body: { title: string; body: string }) => Promise<void>;
};

export function ContentPageEditor({
  slug,
  heading,
  description,
  page,
  loading = false,
  onSave,
}: ContentPageEditorProps) {
  const [title, setTitle] = useState(page?.title ?? '');
  const [body, setBody] = useState(page?.body ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(page?.title ?? '');
    setBody(page?.body ?? '');
  }, [page?.title, page?.body, slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), body: body.trim() });
    } finally {
      setSaving(false);
    }
  }

  const updatedLabel = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleString('ar-LY')
    : null;

  return (
    <>
      <section className="panel">
        <h2>{heading}</h2>
        <p className="muted">{description}</p>
        {updatedLabel ? (
          <p className="muted">آخر تحديث: {updatedLabel}</p>
        ) : null}
      </section>

      <section className="panel">
        <form className="detail-form" onSubmit={handleSubmit}>
          <Input
            label="العنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading || saving}
          />
          <label className="field">
            <span className="field__label">المحتوى</span>
            <textarea
              className="input"
              rows={18}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              disabled={loading || saving}
              placeholder="اكتب المحتوى الذي سيظهر في التطبيق..."
            />
            <span className="field__hint">
              يظهر هذا النص كما هو في التطبيق (يمكن استخدام أسطر جديدة).
            </span>
          </label>
          <Button type="submit" disabled={loading || saving || !title.trim() || !body.trim()}>
            {saving ? 'جاري الحفظ...' : COMMON.save}
          </Button>
        </form>
      </section>
    </>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COMMON } from '../../i18n/ar';
import type { Faq, SupportSettings, WorkingHoursRange } from '../../types';
import { getId } from './shared';

type SupportPageProps = {
  supportSettings: SupportSettings | null;
  faqs: Faq[];
  loading?: boolean;
  onUpdateSettings: (body: {
    phone: string;
    whatsapp: string;
    email: string;
    twitter: string;
    workingHours: WorkingHoursRange[];
    emergencyMessage: string;
    emergencyPhone: string;
    appVersion: string;
    lastUpdateLabel: string;
    active?: boolean;
  }) => Promise<void>;
  onCreateFaq: (body: {
    question: string;
    answer: string;
    sortOrder?: number;
    active?: boolean;
  }) => Promise<void>;
  onUpdateFaq: (
    id: string,
    body: {
      question?: string;
      answer?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
};

const EMPTY_HOURS: WorkingHoursRange = {
  label: '',
  startTime: '08:00',
  endTime: '20:00',
};

function buildSettingsForm(settings: SupportSettings | null) {
  return {
    phone: settings?.phone ?? '920000000',
    whatsapp: settings?.whatsapp ?? '091xxxxxxxx',
    email: settings?.email ?? 'support@text.sa',
    twitter: settings?.twitter ?? 'text',
    workingHours:
      settings?.workingHours?.length
        ? settings.workingHours.map((row) => ({ ...row }))
        : [
            { label: 'الأحد - الخميس', startTime: '08:00', endTime: '20:00' },
            { label: 'الجمعة - السبت', startTime: '10:00', endTime: '18:00' },
          ],
    emergencyMessage:
      settings?.emergencyMessage ??
      'حالة طوارئ: للإبلاغ عن مشاكل عاجلة مثل انسكاب النفايات أو تأخير حرج، اتصل بخط الطوارئ.',
    emergencyPhone: settings?.emergencyPhone ?? '920000000',
    appVersion: settings?.appVersion ?? 'v2.4.1',
    lastUpdateLabel: settings?.lastUpdateLabel ?? 'يونيو ٢٠٢٦',
    active: settings?.active ?? true,
  };
}

export function SupportPage({
  supportSettings,
  faqs,
  loading = false,
  onUpdateSettings,
  onCreateFaq,
  onUpdateFaq,
  onDeleteFaq,
}: SupportPageProps) {
  const [settingsForm, setSettingsForm] = useState(buildSettingsForm(supportSettings));
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    sortOrder: 0,
    active: true,
  });
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(buildSettingsForm(supportSettings));
  }, [supportSettings]);

  const faqRows = useMemo(
    () =>
      [...faqs]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((faq) => ({
          ...faq,
          statusLabel: faq.active ? 'نشط' : 'غير نشط',
        })),
    [faqs],
  );

  const resetFaqForm = () => {
    setEditingFaqId(null);
    setFaqForm({
      question: '',
      answer: '',
      sortOrder: faqs.length,
      active: true,
    });
  };

  const handleSettingsSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onUpdateSettings(settingsForm);
  };

  const handleFaqSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    if (editingFaqId) {
      void onUpdateFaq(editingFaqId, faqForm).then(resetFaqForm);
      return;
    }

    void onCreateFaq(faqForm).then(resetFaqForm);
  };

  const startEditFaq = (faq: Faq) => {
    setEditingFaqId(getId(faq));
    setFaqForm({
      question: faq.question ?? '',
      answer: faq.answer ?? '',
      sortOrder: faq.sortOrder ?? 0,
      active: faq.active ?? true,
    });
  };

  return (
    <>
      <section className="panel">
        <h2>صفحة الدعم</h2>
        <p className="muted">إدارة محتوى شاشة الدعم في تطبيق العملاء.</p>
      </section>

      <section className="panel">
        <h3>تواصل معنا</h3>
        <form className="row-form" onSubmit={handleSettingsSubmit}>
          <Input
            placeholder="رقم الهاتف"
            value={settingsForm.phone}
            onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
          />
          <Input
            placeholder="واتساب"
            value={settingsForm.whatsapp}
            onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
          />
          <Input
            placeholder="البريد الإلكتروني"
            value={settingsForm.email}
            onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
          />
          <Input
            placeholder="تويتر"
            value={settingsForm.twitter}
            onChange={(e) => setSettingsForm({ ...settingsForm, twitter: e.target.value })}
          />

          <h4>ساعات العمل</h4>
          {settingsForm.workingHours.map((row, index) => (
            <div key={`hours-${index}`} className="row-form">
              <Input
                placeholder="الأيام"
                value={row.label}
                onChange={(e) => {
                  const workingHours = [...settingsForm.workingHours];
                  workingHours[index] = { ...row, label: e.target.value };
                  setSettingsForm({ ...settingsForm, workingHours });
                }}
              />
              <Input
                type="time"
                value={row.startTime}
                onChange={(e) => {
                  const workingHours = [...settingsForm.workingHours];
                  workingHours[index] = { ...row, startTime: e.target.value };
                  setSettingsForm({ ...settingsForm, workingHours });
                }}
              />
              <Input
                type="time"
                value={row.endTime}
                onChange={(e) => {
                  const workingHours = [...settingsForm.workingHours];
                  workingHours[index] = { ...row, endTime: e.target.value };
                  setSettingsForm({ ...settingsForm, workingHours });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setSettingsForm({
                    ...settingsForm,
                    workingHours: settingsForm.workingHours.filter((_, i) => i !== index),
                  })
                }
              >
                {COMMON.delete}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setSettingsForm({
                ...settingsForm,
                workingHours: [...settingsForm.workingHours, { ...EMPTY_HOURS }],
              })
            }
          >
            إضافة فترة
          </Button>

          <h4>حالة طوارئ</h4>
          <textarea
            className="input"
            rows={3}
            placeholder="رسالة الطوارئ"
            value={settingsForm.emergencyMessage}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, emergencyMessage: e.target.value })
            }
          />
          <Input
            placeholder="هاتف الطوارئ"
            value={settingsForm.emergencyPhone}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, emergencyPhone: e.target.value })
            }
          />

          <h4>إصدار التطبيق</h4>
          <Input
            placeholder="الإصدار"
            value={settingsForm.appVersion}
            onChange={(e) => setSettingsForm({ ...settingsForm, appVersion: e.target.value })}
          />
          <Input
            placeholder="آخر تحديث"
            value={settingsForm.lastUpdateLabel}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, lastUpdateLabel: e.target.value })
            }
          />

          <select
            value={settingsForm.active ? 'active' : 'inactive'}
            onChange={(e) =>
              setSettingsForm({ ...settingsForm, active: e.target.value === 'active' })
            }
          >
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          <Button type="submit" disabled={loading}>
            {COMMON.save}
          </Button>
        </form>
      </section>

      <section className="panel">
        <h3>الأسئلة الشائعة</h3>
        <form className="row-form" onSubmit={handleFaqSubmit}>
          <Input
            placeholder="السؤال"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="الإجابة"
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
          />
          <Input
            type="number"
            placeholder="الترتيب"
            value={faqForm.sortOrder}
            onChange={(e) =>
              setFaqForm({ ...faqForm, sortOrder: Number(e.target.value) || 0 })
            }
          />
          <select
            value={faqForm.active ? 'active' : 'inactive'}
            onChange={(e) => setFaqForm({ ...faqForm, active: e.target.value === 'active' })}
          >
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <div className="row-actions">
            <Button type="submit" disabled={loading}>
              {editingFaqId ? COMMON.save : COMMON.create}
            </Button>
            {editingFaqId ? (
              <Button type="button" variant="ghost" onClick={resetFaqForm}>
                {COMMON.cancel}
              </Button>
            ) : null}
          </div>
        </form>

        <DataTable
          title="قائمة الأسئلة"
          rows={faqRows}
          columns={[
            { key: 'sortOrder', label: 'الترتيب' },
            { key: 'question', label: 'السؤال' },
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
                    setDeleteFaqId(getId(row));
                  }}
                >
                  {COMMON.delete}
                </Button>
              ),
            },
          ]}
          onSelect={(row) => startEditFaq(row)}
        />
      </section>

      <ConfirmDialog
        open={Boolean(deleteFaqId)}
        title="حذف السؤال"
        description="هل أنت متأكد من حذف هذا السؤال؟"
        onCancel={() => setDeleteFaqId(null)}
        onConfirm={() => {
          if (!deleteFaqId) return;
          void onDeleteFaq(deleteFaqId).then(() => setDeleteFaqId(null));
        }}
      />
    </>
  );
}

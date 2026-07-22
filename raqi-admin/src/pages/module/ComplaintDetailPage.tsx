import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Complaint, Customer, User } from '../../types';
import { customerDisplayName, getId, userNameById } from './shared';
import {
  COMPLAINT_STATUS_OPTIONS,
  complaintStatusLabel,
} from './complaintUi';

type ComplaintDetailPageProps = {
  complaints: Complaint[];
  customers: Customer[];
  users: User[];
  onUpdate: (
    id: string,
    body: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      assignee?: string;
    },
  ) => Promise<void>;
};

const STAFF_ROLES = new Set(['admin', 'manager', 'supervisor']);

export function ComplaintDetailPage({
  complaints,
  customers,
  users,
  onUpdate,
}: ComplaintDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const complaint = useMemo(
    () => complaints.find((item) => getId(item) === id) ?? null,
    [complaints, id],
  );

  const [form, setForm] = useState({
    status: 'open' as NonNullable<Complaint['status']>,
    assignee: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!complaint) return;
    setForm({
      status: complaint.status ?? 'open',
      assignee: complaint.assignee ?? '',
    });
  }, [complaint]);

  const staffUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          STAFF_ROLES.has(user.role ?? '') &&
          (user.status ?? 'active') === 'active',
      ),
    [users],
  );

  const customer = useMemo(() => {
    if (!complaint?.customerId) return null;
    return customers.find((c) => getId(c) === complaint.customerId) ?? null;
  }, [complaint, customers]);

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!complaint) return;
    setSaving(true);
    try {
      await onUpdate(getId(complaint), {
        status: form.status,
        assignee: form.assignee || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!complaint) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/complaints')}>
          ← العودة إلى الشكاوى
        </Button>
        <div className="customer-empty">
          <h2>الشكوى غير موجودة</h2>
          <p>تعذر العثور على هذه الشكوى أو تم حذفها.</p>
          <Button type="button" onClick={() => navigate('/complaints')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page customer-detail-page">
      <header className="customer-detail-hero">
        <div className="customer-detail-hero__top">
          <Button type="button" variant="ghost" onClick={() => navigate('/complaints')}>
            ← العودة إلى الشكاوى
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل الشكوى</p>
            <h2 className="customer-detail-hero__title">
              {complaint.subject || 'بدون موضوع'}
            </h2>
            <div className="customer-detail-hero__meta">
              <span>
                {customer
                  ? customerDisplayName(customer, users)
                  : 'عميل غير معروف'}
              </span>
              <span>
                {complaint.assignee
                  ? `المسؤول: ${userNameById(users, complaint.assignee)}`
                  : 'بدون مسؤول'}
              </span>
              <StatusBadge status={complaint.status ?? 'open'} />
            </div>
          </div>
        </div>
      </header>

      <div className="customer-detail-grid">
        <section className="customer-detail-card customer-detail-card--wide">
          <h3 className="customer-form-section__title">محتوى الشكوى</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>الموضوع</dt>
              <dd>{complaint.subject ?? '—'}</dd>
            </div>
            <div className="info-list__row">
              <dt>العميل</dt>
              <dd>
                {customer ? customerDisplayName(customer, users) : '—'}
              </dd>
            </div>
            <div className="info-list__row">
              <dt>{COMMON.status}</dt>
              <dd>{complaintStatusLabel(complaint.status)}</dd>
            </div>
            <div className="info-list__row">
              <dt>المسؤول</dt>
              <dd>
                {complaint.assignee
                  ? userNameById(users, complaint.assignee)
                  : 'غير معيّن'}
              </dd>
            </div>
            <div className="info-list__row">
              <dt>التفاصيل</dt>
              <dd style={{ whiteSpace: 'pre-wrap' }}>
                {complaint.body?.trim() ? complaint.body : 'لا يوجد وصف إضافي'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <FormCard
        title="تحديث الشكوى"
        description="غيّر الحالة أو عيّن مسؤولاً من فريق اللوحة ثم احفظ"
        onSubmit={submitUpdate}
        submitLabel="حفظ التغييرات"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">المتابعة</h3>
            <div className="form-grid">
              <Select
                label={COMMON.status}
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as NonNullable<Complaint['status']>,
                  })
                }
              >
                {COMPLAINT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Select
                label="المسؤول"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              >
                <option value="">غير معيّن</option>
                {staffUsers.map((user) => (
                  <option key={getId(user)} value={getId(user)}>
                    {user.name ?? user.email ?? getId(user)}
                  </option>
                ))}
              </Select>
            </div>
            {!staffUsers.length ? (
              <p className="field__hint">
                لا يوجد مدراء أو مشرفون نشطون لتعيين الشكوى.
              </p>
            ) : null}
          </section>
        </div>
      </FormCard>
    </div>
  );
}

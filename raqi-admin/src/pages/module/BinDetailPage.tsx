import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Bin, BinAssignment, Customer, User } from '../../types';
import { getId } from './shared';
import {
  binStock,
  customerNameById,
  customerOptionLabel,
  formatBinCapacity,
  formatBinFee,
} from './binUi';

type BinDetailPageProps = {
  bins: Bin[];
  customers: Customer[];
  users: User[];
  onUpdate: (
    id: string,
    body: { capacity?: number; fee?: number; totalCount?: number; active?: boolean },
  ) => Promise<void>;
  onAssign: (id: string, customerId: string) => Promise<void>;
  onLoadAssignments: (binId: string) => Promise<BinAssignment[]>;
  onReleaseAssignment: (assignmentId: string) => Promise<void>;
};

export function BinDetailPage({
  bins,
  customers,
  users,
  onUpdate,
  onAssign,
  onLoadAssignments,
  onReleaseAssignment,
}: BinDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const bin = useMemo(() => bins.find((item) => getId(item) === id) ?? null, [bins, id]);

  const [editForm, setEditForm] = useState({
    capacity: '',
    fee: '',
    totalCount: '',
    active: true,
  });
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignments, setAssignments] = useState<BinAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!bin) return;
    setEditForm({
      capacity: bin.capacity != null ? String(bin.capacity) : '',
      fee: bin.fee != null ? String(bin.fee) : '',
      totalCount: bin.totalCount != null ? String(bin.totalCount) : '',
      active: bin.active !== false,
    });
  }, [bin]);

  useEffect(() => {
    if (!id) {
      setAssignments([]);
      return;
    }
    let cancelled = false;
    setAssignmentsLoading(true);
    void onLoadAssignments(id)
      .then((rows) => {
        if (!cancelled) setAssignments(rows);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setAssignmentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Reload when stock changes after assign/release (bins refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, bins]);

  const stock = bin ? binStock(bin) : { total: 0, available: 0, assigned: 0 };

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!bin) return;
    setSaving(true);
    try {
      await onUpdate(getId(bin), {
        capacity: editForm.capacity ? Number(editForm.capacity) : 0,
        fee: editForm.fee ? Number(editForm.fee) : 0,
        totalCount: Number(editForm.totalCount),
        active: editForm.active,
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitAssign(e: FormEvent) {
    e.preventDefault();
    if (!bin || !assignCustomerId) return;
    setSaving(true);
    try {
      await onAssign(getId(bin), assignCustomerId);
      setAssignCustomerId('');
      const rows = await onLoadAssignments(getId(bin));
      setAssignments(rows);
    } finally {
      setSaving(false);
    }
  }

  async function handleRelease() {
    if (!confirmReleaseId || !bin) return;
    setSaving(true);
    try {
      await onReleaseAssignment(confirmReleaseId);
      setConfirmReleaseId(null);
      const rows = await onLoadAssignments(getId(bin));
      setAssignments(rows);
    } finally {
      setSaving(false);
    }
  }

  if (!bin) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/bins')}>
          ← العودة إلى الصناديق
        </Button>
        <div className="customer-empty">
          <h2>الصندوق غير موجود</h2>
          <p>تعذر العثور على هذا النوع أو تم حذفه.</p>
          <Button type="button" onClick={() => navigate('/bins')}>
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
          <Button type="button" variant="ghost" onClick={() => navigate('/bins')}>
            ← العودة إلى الصناديق
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل نوع الصندوق</p>
            <h2 className="customer-detail-hero__title" dir="ltr">
              {bin.code || '—'}
            </h2>
            <div className="customer-detail-hero__meta">
              <span>{formatBinCapacity(bin.capacity)}</span>
              <span>{formatBinFee(bin.fee)}</span>
              <span>
                متاح {stock.available} / {stock.total}
              </span>
              <StatusBadge status={bin.active !== false ? 'active' : 'inactive'} />
            </div>
          </div>
        </div>
      </header>

      <div className="customers-stats">
        <div className="customers-stat">
          <span className="customers-stat__label">الإجمالي</span>
          <strong className="customers-stat__value">{stock.total}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">المتاح</span>
          <strong className="customers-stat__value">{stock.available}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">المخصص</span>
          <strong className="customers-stat__value">{stock.assigned}</strong>
        </div>
      </div>

      <FormCard
        title="تعديل الصندوق"
        description="حدّث السعة أو الرسوم أو المخزون أو حالة التفعيل"
        onSubmit={submitUpdate}
        submitLabel="حفظ التغييرات"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">المواصفات</h3>
            <div className="form-grid">
              <Input
                label="السعة (لتر)"
                type="number"
                min={0}
                dir="ltr"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
              />
              <Input
                label="الرسوم (د.ل)"
                type="number"
                min={0}
                dir="ltr"
                value={editForm.fee}
                onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })}
              />
              <Input
                label="الكمية الإجمالية"
                type="number"
                min={stock.assigned}
                dir="ltr"
                value={editForm.totalCount}
                onChange={(e) => setEditForm({ ...editForm, totalCount: e.target.value })}
                required
              />
              <Select
                label="التفعيل"
                value={editForm.active ? 'active' : 'inactive'}
                onChange={(e) =>
                  setEditForm({ ...editForm, active: e.target.value === 'active' })
                }
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </Select>
            </div>
            <p className="field__hint">
              لا يمكن تخفيض الكمية الإجمالية عن عدد الوحدات المخصصة حالياً ({stock.assigned}).
            </p>
          </section>
        </div>
      </FormCard>

      <FormCard
        title="تخصيص لعميل"
        description={
          stock.available > 0
            ? 'اختر عميلاً لتخصيص وحدة متاحة من هذا النوع'
            : 'لا توجد وحدات متاحة للتخصيص حالياً'
        }
        onSubmit={stock.available > 0 ? submitAssign : undefined}
        submitLabel="تخصيص الصندوق"
        loading={saving}
      >
        {stock.available > 0 ? (
          <div className="form-grid">
            <Select
              label="العميل"
              value={assignCustomerId}
              onChange={(e) => setAssignCustomerId(e.target.value)}
              required
            >
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={getId(customer)} value={getId(customer)}>
                  {customerOptionLabel(customer, users)}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <p className="field__hint">زد الكمية الإجمالية أو ألغِ تخصيصاً قائماً أولاً.</p>
        )}
        {!customers.length ? (
          <p className="field__hint">أضف عملاء أولًا من صفحة العملاء.</p>
        ) : null}
      </FormCard>

      <section className="customer-detail-card customer-detail-card--wide">
        <h3 className="customer-form-section__title">
          العملاء الذين أخذوا هذا الصندوق ({assignments.length})
        </h3>
        {assignmentsLoading ? (
          <p className="field__hint">{COMMON.loading}</p>
        ) : assignments.length === 0 ? (
          <p className="field__hint">لم يأخذ أي عميل هذا الصندوق بعد.</p>
        ) : (
          <ul className="record-list">
            {assignments.map((assignment) => (
              <li key={getId(assignment)} className="record-list__item">
                <div className="record-list__header">
                  <strong>
                    {customerNameById(customers, users, assignment.customerId)}
                  </strong>
                  <StatusBadge status={assignment.active ? 'assigned' : 'inactive'} />
                </div>
                <div className="record-list__meta">
                  <span>التوصيل: {assignment.deliveryDate ?? '—'}</span>
                  {assignment.active ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmReleaseId(getId(assignment))}
                      disabled={saving}
                    >
                      إلغاء التخصيص
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmReleaseId)}
        title="إلغاء تخصيص الصندوق"
        description="هل تريد إلغاء تخصيص هذا الصندوق من العميل وإرجاع وحدة إلى المخزون؟"
        onCancel={() => setConfirmReleaseId(null)}
        onConfirm={() => void handleRelease()}
      />
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Bin, BinAssignment, Customer, User } from '../../types';
import { getId, customerDisplayName } from './shared';

type BinsPageProps = {
  bins: Bin[];
  customers: Customer[];
  users: User[];
  loading?: boolean;
  onCreate: (body: {
    code: string;
    capacity?: number;
    fee?: number;
    totalCount: number;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    body: { capacity?: number; fee?: number; totalCount?: number; active?: boolean },
  ) => Promise<void>;
  onAssign: (id: string, customerId: string) => Promise<void>;
  onLoadAssignments: (binId: string) => Promise<BinAssignment[]>;
  onReleaseAssignment: (assignmentId: string) => Promise<void>;
};

const emptyForm = {
  code: '',
  capacity: '',
  fee: '',
  totalCount: '',
};

function customerOptionLabel(customer: Customer, users: User[]) {
  return customerDisplayName(customer, users);
}

function customerNameById(
  customers: Customer[],
  users: User[],
  customerId?: string | null,
) {
  if (!customerId) return '—';
  const customer = customers.find((item) => getId(item) === customerId);
  if (!customer) return '—';
  return customerOptionLabel(customer, users);
}

export function BinsPage({
  bins,
  customers,
  users,
  loading = false,
  onCreate,
  onUpdate,
  onAssign,
  onLoadAssignments,
  onReleaseAssignment,
}: BinsPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Bin | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignments, setAssignments] = useState<BinAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tableRows = useMemo(
    () =>
      bins.map((bin) => {
        const total = bin.totalCount ?? 0;
        const available = bin.availableCount ?? 0;
        const assigned = Math.max(0, total - available);
        return {
          ...bin,
          capacityLabel: bin.capacity != null ? `${bin.capacity} لتر` : '—',
          feeLabel: bin.fee != null ? `${bin.fee.toLocaleString('ar-LY')} د.ل` : '0 د.ل',
          totalLabel: String(total),
          availableLabel: String(available),
          assignedLabel: String(assigned),
          activeLabel: bin.active !== false ? 'نشط' : 'غير نشط',
          activeKey: bin.active !== false ? 'active' : 'inactive',
        };
      }),
    [bins],
  );

  const selectedId = selected ? getId(selected) : '';

  useEffect(() => {
    if (!selectedId) return;
    const fresh = bins.find((bin) => getId(bin) === selectedId);
    if (fresh) {
      setSelected(fresh);
    }
  }, [bins, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setAssignments([]);
      return;
    }
    let cancelled = false;
    setAssignmentsLoading(true);
    void onLoadAssignments(selectedId)
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
  }, [selectedId, bins]);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || form.totalCount === '') return;
    setSaving(true);
    try {
      await onCreate({
        code: form.code.trim(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        fee: form.fee ? Number(form.fee) : undefined,
        totalCount: Number(form.totalCount),
      });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), {
        capacity: selected.capacity,
        fee: selected.fee,
        totalCount: selected.totalCount,
        active: selected.active,
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitAssign(e: FormEvent) {
    e.preventDefault();
    if (!selected || !assignCustomerId) return;
    setSaving(true);
    try {
      await onAssign(getId(selected), assignCustomerId);
      setAssignCustomerId('');
      const rows = await onLoadAssignments(getId(selected));
      setAssignments(rows);
    } finally {
      setSaving(false);
    }
  }

  async function handleRelease() {
    if (!confirmReleaseId) return;
    setSaving(true);
    try {
      await onReleaseAssignment(confirmReleaseId);
      setConfirmReleaseId(null);
      if (selected) {
        const rows = await onLoadAssignments(getId(selected));
        setAssignments(rows);
      }
    } finally {
      setSaving(false);
    }
  }

  const available = selected?.availableCount ?? 0;
  const total = selected?.totalCount ?? 0;
  const assignedCount = Math.max(0, total - available);

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة نوع صندوق"
        description="سجّل نوع صندوق مع الكمية الإجمالية المتاحة في المخزون"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="رمز الصندوق"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="مثال: BIN-240L"
            dir="ltr"
            required
          />
          <Input
            label="السعة (لتر)"
            type="number"
            min={0}
            dir="ltr"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="240"
          />
          <Input
            label="الرسوم (د.ل)"
            type="number"
            min={0}
            dir="ltr"
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
            placeholder="50"
          />
          <Input
            label="الكمية الإجمالية"
            type="number"
            min={0}
            dir="ltr"
            value={form.totalCount}
            onChange={(e) => setForm({ ...form, totalCount: e.target.value })}
            placeholder="50"
            required
          />
        </div>
      </FormCard>

      <DataTable
        title="الصناديق"
        description="إدارة مخزون أنواع الصناديق وتخصيصها للعملاء"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['code', 'capacityLabel', 'totalLabel', 'availableLabel', 'assignedLabel', 'activeLabel']}
        columns={[
          { key: 'code', label: 'الرمز' },
          { key: 'capacityLabel', label: 'السعة' },
          { key: 'feeLabel', label: 'الرسوم' },
          { key: 'totalLabel', label: 'الإجمالي' },
          { key: 'availableLabel', label: 'المتاح' },
          { key: 'assignedLabel', label: 'المخصص' },
          {
            key: 'activeKey',
            label: 'التفعيل',
            render: (row) => <StatusBadge status={String(row.activeKey)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تفاصيل الصندوق"
          subtitle={selected.code ?? getId(selected)}
          onClose={() => {
            setSelected(null);
            setAssignCustomerId('');
            setConfirmReleaseId(null);
            setAssignments([]);
          }}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">المخزون</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>الإجمالي</dt>
                  <dd>{total}</dd>
                </div>
                <div className="info-list__row">
                  <dt>المتاح</dt>
                  <dd>{available}</dd>
                </div>
                <div className="info-list__row">
                  <dt>المخصص</dt>
                  <dd>{assignedCount}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">تعديل الصندوق</h4>
              <form className="form-grid" onSubmit={submitUpdate}>
                <Input
                  label="السعة (لتر)"
                  type="number"
                  min={0}
                  dir="ltr"
                  value={selected.capacity ?? 0}
                  onChange={(e) =>
                    setSelected({ ...selected, capacity: Number(e.target.value) })
                  }
                />
                <Input
                  label="الرسوم (د.ل)"
                  type="number"
                  min={0}
                  dir="ltr"
                  value={selected.fee ?? 0}
                  onChange={(e) =>
                    setSelected({ ...selected, fee: Number(e.target.value) })
                  }
                />
                <Input
                  label="الكمية الإجمالية"
                  type="number"
                  min={assignedCount}
                  dir="ltr"
                  value={selected.totalCount ?? 0}
                  onChange={(e) =>
                    setSelected({ ...selected, totalCount: Number(e.target.value) })
                  }
                />
                <Select
                  label="التفعيل"
                  value={selected.active !== false ? 'true' : 'false'}
                  onChange={(e) =>
                    setSelected({ ...selected, active: e.target.value === 'true' })
                  }
                >
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </Select>
                <div className="form-grid__actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : COMMON.save}
                  </Button>
                </div>
              </form>
            </section>

            {available > 0 ? (
              <section className="detail-block">
                <h4 className="detail-block__title">تخصيص لعميل</h4>
                <form className="form-grid" onSubmit={submitAssign}>
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
                  <div className="form-grid__actions">
                    <Button type="submit" disabled={saving || !assignCustomerId}>
                      تخصيص الصندوق
                    </Button>
                  </div>
                </form>
                {!customers.length ? (
                  <p className="field__hint">أضف عملاء أولًا من صفحة العملاء.</p>
                ) : null}
              </section>
            ) : (
              <section className="detail-block">
                <p className="field__hint">لا توجد وحدات متاحة للتخصيص.</p>
              </section>
            )}

            <section className="detail-block">
              <h4 className="detail-block__title">
                العملاء الذين أخذوا هذا الصندوق ({assignments.length})
              </h4>
              {assignmentsLoading ? (
                <p className="field__hint">جاري التحميل...</p>
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
                        <StatusBadge
                          status={assignment.active ? 'assigned' : 'inactive'}
                        />
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
          </div>
        </DetailPanel>
      ) : null}

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

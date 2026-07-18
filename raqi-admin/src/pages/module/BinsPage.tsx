import { FormEvent, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Bin, Customer, User } from '../../types';
import { getId, customerDisplayName } from './shared';

type BinStatus = 'available' | 'assigned' | 'maintenance';

type BinsPageProps = {
  bins: Bin[];
  customers: Customer[];
  users: User[];
  loading?: boolean;
  onCreate: (body: { code: string; qr: string; capacity?: number; fee?: number }) => Promise<void>;
  onUpdate: (
    id: string,
    body: { capacity?: number; fee?: number; status?: BinStatus },
  ) => Promise<void>;
  onAssign: (id: string, customerId: string) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
};

const emptyForm = {
  code: '',
  qr: '',
  capacity: '',
  fee: '',
};

const BIN_STATUS_OPTIONS: { value: BinStatus; label: string }[] = [
  { value: 'available', label: 'متاح' },
  { value: 'assigned', label: 'مخصص' },
  { value: 'maintenance', label: 'صيانة' },
];

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
  onUnassign,
}: BinsPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Bin | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [saving, setSaving] = useState(false);

  const tableRows = useMemo(
    () =>
      bins.map((bin) => ({
        ...bin,
        capacityLabel: bin.capacity != null ? `${bin.capacity} لتر` : '—',
        feeLabel: bin.fee != null ? `${bin.fee.toLocaleString('ar-LY')} د.ل` : '0 د.ل',
        customerName: customerNameById(customers, users, bin.customerId),
        deliveryDateLabel: bin.deliveryDate ?? '—',
        activeLabel: bin.active ? 'نشط' : 'غير نشط',
        activeKey: bin.active ? 'active' : 'inactive',
      })),
    [bins, customers, users],
  );

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.qr.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        code: form.code.trim(),
        qr: form.qr.trim(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        fee: form.fee ? Number(form.fee) : undefined,
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
        status: selected.status,
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
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign() {
    if (!selected) return;
    setSaving(true);
    try {
      await onUnassign(getId(selected));
      setConfirmUnassign(false);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة صندوق"
        description="سجّل صندوقًا جديدًا برمز تعريف ورمز QR وسعة التخزين"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label="رمز الصندوق"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="مثال: BIN-001"
            dir="ltr"
            required
          />
          <Input
            label="رمز QR"
            value={form.qr}
            onChange={(e) => setForm({ ...form, qr: e.target.value })}
            placeholder="مثال: QR-BIN-001"
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
            placeholder="120"
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
        </div>
      </FormCard>

      <DataTable
        title="الصناديق"
        description="إدارة مخزون الصناديق وتخصيصها للعملاء"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['code', 'capacityLabel', 'status', 'customerName', 'activeLabel', 'deliveryDateLabel']}
        columns={[
          { key: 'code', label: 'الرمز' },
          { key: 'capacityLabel', label: 'السعة' },
          { key: 'feeLabel', label: 'الرسوم' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
          { key: 'customerName', label: 'العميل' },
          { key: 'deliveryDateLabel', label: 'تاريخ التوصيل' },
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
            setConfirmUnassign(false);
          }}
          footer={
            selected.customerId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmUnassign(true)}
                disabled={saving}
              >
                إلغاء التخصيص
              </Button>
            ) : null
          }
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات الصندوق</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>رمز QR</dt>
                  <dd>{selected.qr ?? '—'}</dd>
                </div>
                <div className="info-list__row">
                  <dt>العميل الحالي</dt>
                  <dd>{customerNameById(customers, users, selected.customerId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>تاريخ التوصيل</dt>
                  <dd dir="ltr">{selected.deliveryDate ?? '—'}</dd>
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
                <Select
                  label={COMMON.status}
                  value={selected.status ?? 'available'}
                  onChange={(e) =>
                    setSelected({ ...selected, status: e.target.value as BinStatus })
                  }
                >
                  {BIN_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <div className="form-grid__actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : COMMON.save}
                  </Button>
                </div>
              </form>
            </section>

            {!selected.customerId ? (
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
            ) : null}
          </div>
        </DetailPanel>
      ) : null}

      <ConfirmDialog
        open={confirmUnassign}
        title="إلغاء تخصيص الصندوق"
        description="هل تريد إلغاء تخصيص هذا الصندوق من العميل الحالي؟"
        onCancel={() => setConfirmUnassign(false)}
        onConfirm={() => void handleUnassign()}
      />
    </div>
  );
}

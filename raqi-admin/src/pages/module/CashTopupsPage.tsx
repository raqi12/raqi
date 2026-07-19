import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { CashTopupRequest, CashTopupStatus, Customer } from '../../types';
import { customerDisplayName, getId } from './shared';

const STATUS_LABELS: Record<CashTopupStatus, string> = {
  pending: 'قيد الانتظار',
  dispatched: 'تم الإرسال',
  collected: 'تم التحصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

type CashTopupsPageProps = {
  cashTopups: CashTopupRequest[];
  customers: Customer[];
  loading?: boolean;
  onAssign: (id: string, body: { courierName: string; courierPhone: string }) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  onCollect: (id: string) => Promise<void>;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string, reason?: string) => Promise<void>;
};

export function CashTopupsPage({
  cashTopups,
  customers,
  loading = false,
  onAssign,
  onDispatch,
  onCollect,
  onConfirm,
  onCancel,
}: CashTopupsPageProps) {
  const [selected, setSelected] = useState<CashTopupRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<CashTopupStatus | ''>('');
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const next = cashTopups.find((item) => getId(item) === getId(selected));
    if (next) {
      setSelected(next);
      setCourierName(next.courierName ?? '');
      setCourierPhone(next.courierPhone ?? '');
    }
  }, [cashTopups]);

  const filtered = useMemo(
    () =>
      statusFilter
        ? cashTopups.filter((item) => item.status === statusFilter)
        : cashTopups,
    [cashTopups, statusFilter],
  );

  const rows = useMemo(
    () =>
      filtered.map((item) => ({
        ...item,
        customerLabel: (() => {
          const customer = customers.find((c) => getId(c) === item.customerId);
          return customer ? customerDisplayName(customer) : item.customerId ?? '—';
        })(),
        statusLabel: item.status ? STATUS_LABELS[item.status] : '—',
        addressSummary: [item.addressLabel, item.addressDetails].filter(Boolean).join(' — ') || '—',
      })),
    [filtered, customers],
  );

  function selectRow(row: CashTopupRequest) {
    setSelected(row);
    setCourierName(row.courierName ?? '');
    setCourierPhone(row.courierPhone ?? '');
    setCancelReason('');
  }

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  }

  async function submitAssign(e: FormEvent) {
    e.preventDefault();
    if (!selected || !courierName.trim() || !courierPhone.trim()) return;
    await run(() =>
      onAssign(getId(selected), {
        courierName: courierName.trim(),
        courierPhone: courierPhone.trim(),
      }),
    );
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <section className="panel" style={{ marginBottom: '1rem' }}>
        <Select
          label="تصفية الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CashTopupStatus | '')}
        >
          <option value="">الكل</option>
          {(Object.keys(STATUS_LABELS) as CashTopupStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </section>

      <DataTable
        title={`شحن نقدي بالمندوب (${rows.length})`}
        description="طلبات شحن المحفظة نقداً عبر مندوب توصيل — الاعتماد يشحن المحفظة"
        rows={rows}
        loading={loading}
        onSelect={selectRow}
        searchKeys={['customerLabel', 'addressSummary', 'statusLabel', 'courierName', 'amount']}
        columns={[
          { key: 'customerLabel', label: 'العميل' },
          { key: 'amount', label: 'المبلغ', render: (r) => `${r.amount ?? '—'} د.ل` },
          { key: 'addressSummary', label: 'العنوان' },
          {
            key: 'status',
            label: 'الحالة',
            render: (r) => <StatusBadge status={String(r.status)} />,
            sortable: false,
          },
          { key: 'courierName', label: 'المندوب', render: (r) => r.courierName || '—' },
        ]}
      />

      {selected ? (
        <DetailPanel
          title={`طلب شحن — ${selected.amount ?? ''} د.ل`}
          subtitle={STATUS_LABELS[selected.status ?? 'pending']}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">التفاصيل</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>العميل</dt>
                  <dd>
                    {(() => {
                      const customer = customers.find((c) => getId(c) === selected.customerId);
                      return customer
                        ? customerDisplayName(customer)
                        : selected.customerId ?? '—';
                    })()}
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>العنوان</dt>
                  <dd>
                    {[selected.addressLabel, selected.addressDetails].filter(Boolean).join(' — ') ||
                      '—'}
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>الموقع</dt>
                  <dd>
                    {selected.lat != null && selected.lng != null
                      ? `${selected.lat}, ${selected.lng}`
                      : '—'}
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>المندوب</dt>
                  <dd>
                    {selected.courierName
                      ? `${selected.courierName} (${selected.courierPhone ?? '—'})`
                      : 'غير معيّن'}
                  </dd>
                </div>
                {selected.cancellationReason ? (
                  <div className="info-list__row">
                    <dt>سبب الإلغاء</dt>
                    <dd>{selected.cancellationReason}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {selected.status === 'pending' || selected.status === 'dispatched' ? (
              <section className="detail-block">
                <h4 className="detail-block__title">تعيين المندوب</h4>
                <form className="detail-form" onSubmit={submitAssign}>
                  <Input
                    label="اسم المندوب"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    required
                    disabled={saving}
                  />
                  <Input
                    label="هاتف المندوب"
                    value={courierPhone}
                    onChange={(e) => setCourierPhone(e.target.value)}
                    required
                    disabled={saving}
                  />
                  <Button type="submit" disabled={saving}>
                    حفظ بيانات المندوب
                  </Button>
                </form>
              </section>
            ) : null}

            <section className="detail-block">
              <h4 className="detail-block__title">الإجراءات</h4>
              <div className="row-actions">
                {selected.status === 'pending' ? (
                  <Button
                    type="button"
                    disabled={saving || !selected.courierName || !selected.courierPhone}
                    onClick={() => void run(() => onDispatch(getId(selected)))}
                  >
                    إرسال المندوب من الشركة
                  </Button>
                ) : null}
                {selected.status === 'dispatched' ? (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void run(() => onCollect(getId(selected)))}
                  >
                    تأكيد التحصيل من العميل
                  </Button>
                ) : null}
                {selected.status === 'collected' ? (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void run(() => onConfirm(getId(selected)))}
                  >
                    اعتماد الاستلام وشحن المحفظة
                  </Button>
                ) : null}
                {selected.status !== 'completed' && selected.status !== 'cancelled' ? (
                  <>
                    <Input
                      label="سبب الإلغاء (اختياري)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saving}
                      onClick={() =>
                        void run(() => onCancel(getId(selected), cancelReason || undefined))
                      }
                    >
                      إلغاء الطلب
                    </Button>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

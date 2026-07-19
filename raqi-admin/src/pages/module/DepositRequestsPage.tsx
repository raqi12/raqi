import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Customer, DepositRequest, User } from '../../types';
import { API_ORIGIN, customerDisplayName, getId } from './shared';

const STATUS_LABELS: Record<NonNullable<DepositRequest['status']>, string> = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
};

type DepositStatusFilter = '' | NonNullable<DepositRequest['status']>;

type DepositRequestsPageProps = {
  depositRequests: DepositRequest[];
  customers: Customer[];
  users: User[];
  loading?: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, rejectionReason?: string) => Promise<void>;
};

function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

export function DepositRequestsPage({
  depositRequests,
  customers,
  users,
  loading = false,
  onApprove,
  onReject,
}: DepositRequestsPageProps) {
  const [selected, setSelected] = useState<DepositRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<DepositStatusFilter>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const next = depositRequests.find((item) => getId(item) === getId(selected));
    if (next) {
      setSelected(next);
    }
  }, [depositRequests]);

  const filtered = useMemo(
    () =>
      statusFilter
        ? depositRequests.filter((item) => item.status === statusFilter)
        : depositRequests,
    [depositRequests, statusFilter],
  );

  const rows = useMemo(
    () =>
      filtered.map((item) => {
        const customer = customers.find((c) => getId(c) === item.customerId);
        return {
          ...item,
          customerLabel: customer
            ? customerDisplayName(customer, users)
            : item.customerId ?? '—',
          phoneLabel: customer?.phone ?? '—',
          statusLabel: item.status ? STATUS_LABELS[item.status] : '—',
          amountLabel: formatMoney(item.amount),
        };
      }),
    [filtered, customers, users],
  );

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  }

  async function submitReject(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await run(() => onReject(getId(selected), rejectionReason.trim() || undefined));
    setRejectionReason('');
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <section className="panel" style={{ marginBottom: '1rem' }}>
        <Select
          label="تصفية الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DepositStatusFilter)}
        >
          <option value="">الكل</option>
          {(Object.keys(STATUS_LABELS) as NonNullable<DepositRequest['status']>[]).map(
            (status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ),
          )}
        </Select>
      </section>

      <DataTable
        title={`طلبات الإيداع (${rows.length})`}
        description="طلبات تحويل بنكي لإيداع المحفظة — الموافقة تشحن رصيد العميل"
        rows={rows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['customerLabel', 'phoneLabel', 'statusLabel', 'amountLabel', 'amount']}
        columns={[
          { key: 'customerLabel', label: 'العميل' },
          {
            key: 'phoneLabel',
            label: COMMON.phone,
            render: (r) => (
              <span dir="ltr">{r.phoneLabel !== '—' ? String(r.phoneLabel) : '—'}</span>
            ),
          },
          {
            key: 'amount',
            label: 'المبلغ',
            render: (r) => formatMoney(Number(r.amount)),
          },
          {
            key: 'status',
            label: COMMON.status,
            render: (r) => <StatusBadge status={String(r.status)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title={`طلب إيداع — ${formatMoney(selected.amount)}`}
          subtitle={
            selected.status ? STATUS_LABELS[selected.status] : undefined
          }
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
                      const customer = customers.find(
                        (c) => getId(c) === selected.customerId,
                      );
                      return customer
                        ? customerDisplayName(customer, users)
                        : selected.customerId ?? '—';
                    })()}
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>المبلغ</dt>
                  <dd>{formatMoney(selected.amount)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>الحالة</dt>
                  <dd>
                    <StatusBadge status={selected.status} />
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>تاريخ المراجعة</dt>
                  <dd>{formatDateTime(selected.reviewedAt)}</dd>
                </div>
                {selected.rejectionReason ? (
                  <div className="info-list__row">
                    <dt>سبب الرفض</dt>
                    <dd>{selected.rejectionReason}</dd>
                  </div>
                ) : null}
                {selected.evidenceImageUrl ? (
                  <div className="info-list__row">
                    <dt>صورة التحويل</dt>
                    <dd>
                      <a
                        href={`${API_ORIGIN}${selected.evidenceImageUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        عرض الإثبات
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {selected.status === 'pending' ? (
              <section className="detail-block">
                <h4 className="detail-block__title">مراجعة الطلب</h4>
                <div className="form-grid">
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void run(() => onApprove(getId(selected)))}
                  >
                    {saving ? 'جاري...' : 'موافقة'}
                  </Button>
                </div>
                <form className="form-grid" onSubmit={submitReject}>
                  <Input
                    label="سبب الرفض (اختياري)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <Button type="submit" variant="ghost" disabled={saving}>
                    رفض الطلب
                  </Button>
                </form>
              </section>
            ) : null}
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

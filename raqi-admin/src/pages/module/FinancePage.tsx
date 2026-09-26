import { useEffect, useState } from 'react';
import { AdminApi } from '../../api/modules';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KpiStat } from '../../components/ui/KpiStat';
import { KpiSkeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { formatApiError } from '../../i18n/ar';
import { formatMoneyLyd } from './shared';
import type {
  FinanceMovement,
  FinanceMovementType,
  FinanceMovements,
  FinancePosition,
  FinanceStatement,
} from '../../types';

type Preset = 'today' | 'week' | 'month' | 'custom';

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'month', label: 'هذا الشهر' },
  { id: 'custom', label: 'نطاق مخصص' },
];

const TYPE_LABELS: Record<string, string> = {
  deposit: 'إيداع',
  admin_credit: 'إضافة إدارية',
  subscription_payment: 'دفع اشتراك',
  additional_collection_payment: 'جمع إضافي',
  payment: 'دفعة',
  refund: 'استرداد',
};

const DIRECTION_LABELS: Record<string, string> = {
  credit: 'داخل',
  debit: 'خارج',
};

const TYPE_OPTIONS: Array<{ value: '' | FinanceMovementType; label: string }> = [
  { value: '', label: 'كل الحركات' },
  { value: 'deposit', label: TYPE_LABELS.deposit },
  { value: 'admin_credit', label: TYPE_LABELS.admin_credit },
  { value: 'payment', label: TYPE_LABELS.payment },
  { value: 'subscription_payment', label: TYPE_LABELS.subscription_payment },
  { value: 'additional_collection_payment', label: TYPE_LABELS.additional_collection_payment },
  { value: 'refund', label: TYPE_LABELS.refund },
];

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

function startOfLocalDay(input: Date | string) {
  const date = typeof input === 'string' ? new Date(`${input}T00:00:00`) : new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfLocalDay(input: Date | string) {
  const date = typeof input === 'string' ? new Date(`${input}T00:00:00`) : new Date(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

function rangeFor(preset: Preset, customFrom: string, customTo: string) {
  const now = new Date();
  if (preset === 'today') {
    return {
      from: startOfLocalDay(now).toISOString(),
      to: endOfLocalDay(now).toISOString(),
    };
  }
  if (preset === 'week') {
    const start = startOfLocalDay(now);
    start.setDate(start.getDate() - start.getDay());
    return { from: start.toISOString(), to: endOfLocalDay(now).toISOString() };
  }
  if (preset === 'month') {
    const start = startOfLocalDay(now);
    start.setDate(1);
    return { from: start.toISOString(), to: endOfLocalDay(now).toISOString() };
  }
  const from = customFrom ? startOfLocalDay(customFrom) : startOfLocalDay(now);
  const to = customTo ? endOfLocalDay(customTo) : endOfLocalDay(now);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function FinancePage() {
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [type, setType] = useState<'' | FinanceMovementType>('');
  const [page, setPage] = useState(1);
  const [position, setPosition] = useState<FinancePosition | null>(null);
  const [statement, setStatement] = useState<FinanceStatement | null>(null);
  const [movements, setMovements] = useState<FinanceMovements | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingPosition(true);
    AdminApi.finance
      .position()
      .then((res) => {
        if (!cancelled) setPosition(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(formatApiError(err instanceof Error ? err.message : 'Request failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPosition(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const range = rangeFor(preset, customFrom, customTo);
    setLoadingPeriod(true);
    setError('');
    Promise.all([
      AdminApi.finance.statement(range),
      AdminApi.finance.movements({ ...range, page, limit: 12, type }),
    ])
      .then(([statementRes, movementsRes]) => {
        if (cancelled) return;
        setStatement(statementRes.data);
        setMovements(movementsRes.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(formatApiError(err instanceof Error ? err.message : 'Request failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPeriod(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preset, customFrom, customTo, type, page]);

  const statementRows = (statement?.byType ?? []).map((line) => ({
    ...line,
    typeLabel: TYPE_LABELS[line.type] ?? line.type,
    directionLabel: DIRECTION_LABELS[line.direction] ?? line.direction,
  }));

  const movementRows: Array<FinanceMovement & Record<string, unknown>> = (
    movements?.items ?? []
  ).map((item) => ({
    ...item,
    typeLabel: TYPE_LABELS[item.type] ?? item.type,
    directionLabel: DIRECTION_LABELS[item.direction] ?? item.direction,
  }));

  return (
    <div className="overview-page">
      <header className="page-header">
        <div>
          <h2 className="page-header__title">كشف مالي</h2>
          <p className="page-header__description">
            أرصدة المحافظ، قيمة الاشتراكات النشطة، وحركة الأموال حسب الفترة
          </p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="kpi-grid kpi-grid--primary" aria-label="الوضع المالي الحالي">
        {loadingPosition ? (
          Array.from({ length: 2 }).map((_, index) => <KpiSkeleton key={index} />)
        ) : (
          <>
            <KpiStat
              label="أموال المحافظ"
              value={formatMoneyLyd(position?.walletFunds)}
              hint={`${position?.walletCount ?? 0} محفظة`}
            />
            <KpiStat
              label="أموال الاشتراكات النشطة"
              value={formatMoneyLyd(position?.activeSubscriptionFunds)}
              hint={
                position?.unpricedCount
                  ? `${position.activeSubscriptionCount} اشتراك نشط، ${position.unpricedCount} بدون سعر خطة`
                  : `${position?.activeSubscriptionCount ?? 0} اشتراك نشط`
              }
            />
          </>
        )}
      </section>

      <section className="panel">
        <h2>الفترة</h2>
        <div className="row-form">
          {PRESETS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={preset === item.id ? 'primary' : 'ghost'}
              onClick={() => {
                setPreset(item.id);
                setPage(1);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {preset === 'custom' ? (
          <div className="row-form">
            <Input
              label="من"
              type="date"
              value={customFrom}
              onChange={(event) => {
                setCustomFrom(event.target.value);
                setPage(1);
              }}
            />
            <Input
              label="إلى"
              type="date"
              value={customTo}
              onChange={(event) => {
                setCustomTo(event.target.value);
                setPage(1);
              }}
            />
          </div>
        ) : null}
        {statement ? (
          <p className="muted">
            {formatDateTime(statement.from)} — {formatDateTime(statement.to)}
          </p>
        ) : null}
      </section>

      <DataTable
        title="حسب نوع الحركة"
        description="تجميع دفتر المحفظة خلال الفترة"
        rows={statementRows}
        loading={loadingPeriod}
        searchKeys={['typeLabel', 'directionLabel']}
        columns={[
          { key: 'typeLabel', label: 'النوع' },
          { key: 'directionLabel', label: 'الاتجاه' },
          { key: 'count', label: 'العدد' },
          {
            key: 'total',
            label: 'المبلغ',
            render: (row) => formatMoneyLyd(row.total),
          },
        ]}
      />

      <section className="panel">
        <Select
          label="تصفية الحركات"
          value={type}
          onChange={(event) => {
            setType(event.target.value as '' | FinanceMovementType);
            setPage(1);
          }}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </section>

      <DataTable
        title="حركات الفترة"
        description="سطور دفتر المحفظة"
        rows={movementRows}
        loading={loadingPeriod}
        searchKeys={['typeLabel', 'directionLabel', 'description', 'customerId']}
        columns={[
          {
            key: 'createdAt',
            label: 'التاريخ',
            render: (row) => formatDateTime(String(row.createdAt ?? '')),
          },
          { key: 'typeLabel', label: 'النوع' },
          { key: 'directionLabel', label: 'الاتجاه' },
          {
            key: 'amount',
            label: 'المبلغ',
            render: (row) => formatMoneyLyd(Number(row.amount ?? 0)),
          },
          {
            key: 'balanceAfter',
            label: 'الرصيد بعد',
            render: (row) => formatMoneyLyd(Number(row.balanceAfter ?? 0)),
          },
          {
            key: 'description',
            label: 'الوصف',
            render: (row) => String(row.description ?? '—'),
          },
        ]}
      />

      {movements && movements.totalPages > 1 ? (
        <footer className="table-pagination">
          <span className="table-pagination__info">
            صفحة {movements.page} من {movements.totalPages} — {movements.total} حركة
          </span>
          <div className="table-pagination__actions">
            <Button
              type="button"
              variant="ghost"
              disabled={movements.page <= 1 || loadingPeriod}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              السابق
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={movements.page >= movements.totalPages || loadingPeriod}
              onClick={() => setPage((current) => current + 1)}
            >
              التالي
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Bin } from '../../types';
import { getId } from './shared';
import {
  binActiveKey,
  binStock,
  formatBinCapacity,
  formatBinFee,
} from './binUi';

type BinsPageProps = {
  bins: Bin[];
  loading?: boolean;
};

export function BinsPage({ bins, loading = false }: BinsPageProps) {
  const navigate = useNavigate();

  const tableRows = useMemo(
    () =>
      bins.map((bin) => {
        const stock = binStock(bin);
        return {
          ...bin,
          capacityLabel: formatBinCapacity(bin.capacity),
          feeLabel: formatBinFee(bin.fee),
          totalLabel: String(stock.total),
          availableLabel: String(stock.available),
          assignedLabel: String(stock.assigned),
          activeLabel: bin.active !== false ? 'نشط' : 'غير نشط',
          activeKey: binActiveKey(bin),
        };
      }),
    [bins],
  );

  const totalUnits = bins.reduce((sum, bin) => sum + (bin.totalCount ?? 0), 0);
  const availableUnits = bins.reduce((sum, bin) => sum + (bin.availableCount ?? 0), 0);
  const assignedUnits = Math.max(0, totalUnits - availableUnits);
  const activeTypes = bins.filter((bin) => bin.active !== false).length;

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">الصناديق</h2>
          <p className="page-header__description">
            إدارة مخزون أنواع الصناديق وتخصيصها للعملاء
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/bins/new')}>
          إضافة نوع صندوق
        </Button>
      </header>

      <div className="customers-stats customers-stats--4">
        <div className="customers-stat">
          <span className="customers-stat__label">أنواع الصناديق</span>
          <strong className="customers-stat__value">{bins.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeTypes}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">متاح</span>
          <strong className="customers-stat__value">{availableUnits}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">مخصص</span>
          <strong className="customers-stat__value">{assignedUnits}</strong>
        </div>
      </div>

      <DataTable
        title="قائمة أنواع الصناديق"
        description="اضغط على صف لفتح التفاصيل والتخصيص"
        rows={tableRows}
        loading={loading}
        onSelect={(row) => navigate(`/bins/${getId(row)}`)}
        searchKeys={[
          'code',
          'capacityLabel',
          'totalLabel',
          'availableLabel',
          'assignedLabel',
          'activeLabel',
        ]}
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
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { IconChevron } from '../../components/ui/Icons';
import { Input } from '../../components/ui/Input';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, STATUS_LABELS } from '../../i18n/ar';
import type {
  Area,
  Bin,
  City,
  Customer,
  Driver,
  Plan,
  Subscription,
  User,
} from '../../types';
import {
  areaLabel,
  areasForCity,
  getId,
  userNameById,
} from './shared';
import {
  EMPTY_SUBSCRIPTION_FILTERS,
  buildSubscriptionTableRows,
  filterSubscriptionRows,
  hasActiveSubscriptionFilters,
  type SubscriptionDateField,
  type SubscriptionFilterState,
} from './subscriptionFilters';

type SubscriptionsPageProps = {
  subscriptions: Subscription[];
  plans: Plan[];
  bins: Bin[];
  customers: Customer[];
  users: User[];
  drivers: Driver[];
  areas: Area[];
  cities: City[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
};

const STATUS_OPTIONS = ['active', 'requested', 'draft', 'suspended', 'expired'] as const;
const PAYMENT_OPTIONS = ['paid', 'unpaid'] as const;

const DATE_FIELD_OPTIONS: Array<{ value: SubscriptionDateField; label: string }> = [
  { value: 'collection', label: 'تاريخ الجمع' },
  { value: 'expires', label: 'تاريخ الانتهاء' },
  { value: 'created', label: 'تاريخ الإنشاء' },
];

export function SubscriptionsPage({
  subscriptions,
  plans,
  bins,
  customers,
  users,
  drivers,
  areas,
  cities,
  loading = false,
  onDelete,
}: SubscriptionsPageProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collectionDatesDialog, setCollectionDatesDialog] = useState<{
    title: string;
    dates: string[];
  } | null>(null);
  const [filters, setFilters] = useState<SubscriptionFilterState>(EMPTY_SUBSCRIPTION_FILTERS);

  const tableRows = useMemo(
    () =>
      buildSubscriptionTableRows(
        subscriptions,
        plans,
        bins,
        customers,
        users,
        drivers,
        areas,
        cities,
      ),
    [areas, bins, cities, customers, drivers, plans, subscriptions, users],
  );

  const filteredRows = useMemo(
    () => filterSubscriptionRows(tableRows, filters),
    [filters, tableRows],
  );

  const filterAreas = useMemo(
    () => (filters.cityId ? areasForCity(areas, filters.cityId) : areas),
    [areas, filters.cityId],
  );

  const filterDrivers = useMemo(() => {
    let list = drivers.filter((d) => (d.status ?? 'active') === 'active');
    if (filters.cityId) {
      list = list.filter((d) => d.cityId === filters.cityId);
    }
    if (filters.areaId) {
      list = list.filter((d) => d.areaId === filters.areaId);
    }
    return list;
  }, [drivers, filters.areaId, filters.cityId]);

  const deleteLabel = useMemo(() => {
    if (!deleteId) return '';
    const row = tableRows.find((item) => getId(item) === deleteId);
    return row?.customerName ? String(row.customerName) : 'هذا الاشتراك';
  }, [deleteId, tableRows]);

  const activeCount = filteredRows.filter((item) => item.status === 'active').length;
  const unpaidCount = filteredRows.filter((item) => item.paymentStatus !== 'paid').length;
  const filtersActive = hasActiveSubscriptionFilters(filters);

  function patchFilters(patch: Partial<SubscriptionFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function resetFilters() {
    setFilters(EMPTY_SUBSCRIPTION_FILTERS);
  }

  return (
    <div className="module-page customers-list-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">الاشتراكات</h2>
          <p className="page-header__description">
            متابعة اشتراكات العملاء وحالات الدفع والتفعيل وتعيين السائقين
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/subscriptions/new')}>
          إنشاء اشتراك
        </Button>
      </header>

      <div className="customers-stats customers-stats--4">
        <div className="customers-stat">
          <span className="customers-stat__label">
            {filtersActive ? 'نتائج البحث' : 'الإجمالي'}
          </span>
          <strong className="customers-stat__value">{filteredRows.length}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">نشط</span>
          <strong className="customers-stat__value">{activeCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">غير مدفوع</span>
          <strong className="customers-stat__value">{unpaidCount}</strong>
        </div>
        <div className="customers-stat">
          <span className="customers-stat__label">كل السجلات</span>
          <strong className="customers-stat__value">{subscriptions.length}</strong>
        </div>
      </div>

      <section
        className={[
          'panel',
          'subscriptions-filters',
          filtersOpen ? 'subscriptions-filters--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="subscriptions-filters__header">
          <button
            type="button"
            className="subscriptions-filters__toggle"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
          >
            <span className="subscriptions-filters__toggle-text">
              <span className="subscriptions-filters__title">بحث وتصفية</span>
              {filtersActive ? (
                <span className="subscriptions-filters__badge">مفعّل</span>
              ) : null}
            </span>
            <IconChevron
              size={16}
              className={[
                'subscriptions-filters__chevron',
                filtersOpen ? 'subscriptions-filters__chevron--open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </button>
          {filtersActive ? (
            <Button type="button" variant="ghost" onClick={resetFilters}>
              مسح التصفية
            </Button>
          ) : null}
        </div>

        {filtersOpen ? (
          <p className="muted subscriptions-filters__hint">
            ابحث بالعميل أو الخطة أو الهاتف أو المعرف، ثم ضيّق النتائج حسب المدينة والسائق والتاريخ
          </p>
        ) : null}

        {filtersOpen ? (
        <div className="form-grid">
          <div className="form-grid__full">
            <SearchInput
              value={filters.query}
              onChange={(value) => patchFilters({ query: value })}
              placeholder="بحث: عميل، هاتف، خطة، مدينة، سائق، صندوق، معرف..."
              aria-label="بحث في الاشتراكات"
            />
          </div>

          <Select
            label={COMMON.city}
            value={filters.cityId}
            onChange={(event) =>
              patchFilters({
                cityId: event.target.value,
                areaId: '',
                driverId: '',
              })
            }
          >
            <option value="">كل المدن</option>
            {cities.map((city) => (
              <option key={getId(city)} value={getId(city)}>
                {city.name}
              </option>
            ))}
          </Select>

          <Select
            label={COMMON.area}
            value={filters.areaId}
            onChange={(event) =>
              patchFilters({
                areaId: event.target.value,
                driverId: '',
              })
            }
          >
            <option value="">كل المناطق</option>
            {filterAreas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {filters.cityId ? area.name : areaLabel(area, cities)}
              </option>
            ))}
          </Select>

          <Select
            label={COMMON.driver}
            value={filters.unassignedDriver ? '__none__' : filters.driverId}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '__none__') {
                patchFilters({ driverId: '', unassignedDriver: true });
                return;
              }
              patchFilters({ driverId: value, unassignedDriver: false });
            }}
          >
            <option value="">كل السائقين</option>
            <option value="__none__">بدون سائق</option>
            {filterDrivers.map((driver) => (
              <option key={getId(driver)} value={getId(driver)}>
                {userNameById(users, driver.userId)}
                {driver.vehicleNumber ? ` (${driver.vehicleNumber})` : ''}
              </option>
            ))}
          </Select>

          <Select
            label="الخطة"
            value={filters.planId}
            onChange={(event) => patchFilters({ planId: event.target.value })}
          >
            <option value="">كل الخطط</option>
            {plans.map((plan) => (
              <option key={getId(plan)} value={getId(plan)}>
                {plan.name}
              </option>
            ))}
          </Select>

          <Select
            label={COMMON.status}
            value={filters.status}
            onChange={(event) => patchFilters({ status: event.target.value })}
          >
            <option value="">كل الحالات</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </Select>

          <Select
            label="الدفع"
            value={filters.paymentStatus}
            onChange={(event) => patchFilters({ paymentStatus: event.target.value })}
          >
            <option value="">كل حالات الدفع</option>
            {PAYMENT_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </Select>

          <Input
            label="يوم جمع محدد"
            type="date"
            value={filters.collectionDate}
            onChange={(event) => patchFilters({ collectionDate: event.target.value })}
          />

          <Select
            label="نوع الفترة"
            value={filters.dateField}
            onChange={(event) =>
              patchFilters({ dateField: event.target.value as SubscriptionDateField })
            }
          >
            {DATE_FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            label="من تاريخ"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => patchFilters({ dateFrom: event.target.value })}
          />

          <Input
            label="إلى تاريخ"
            type="date"
            value={filters.dateTo}
            onChange={(event) => patchFilters({ dateTo: event.target.value })}
          />
        </div>
        ) : null}
      </section>

      <DataTable
        title="قائمة الاشتراكات"
        description="اضغط على صف لفتح صفحة التفاصيل"
        rows={filteredRows}
        loading={loading}
        disableGlobalSearch
        onSelect={(row) => navigate(`/subscriptions/${getId(row)}`)}
        columns={[
          { key: 'customerName', label: 'العميل' },
          { key: 'planName', label: 'الخطة' },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'driverName', label: 'السائق' },
          { key: 'binCode', label: 'الصندوق' },
          {
            key: 'collectionCount',
            label: 'مواعيد الجمع',
            sortable: false,
            render: (row) => {
              const count = Number(row.collectionCount ?? 0);
              const dates = (row.collectionDates as string[] | undefined) ?? [];
              if (count <= 0) return '—';
              return (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCollectionDatesDialog({
                      title: String(row.customerName ?? 'الاشتراك'),
                      dates: [...dates].map(String).sort(),
                    });
                  }}
                >
                  عرض ({count})
                </Button>
              );
            },
          },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
          {
            key: 'paymentStatus',
            label: 'الدفع',
            render: (row) => <StatusBadge status={String(row.paymentStatus)} />,
            sortable: false,
          },
          {
            key: 'actions',
            label: COMMON.actions,
            sortable: false,
            align: 'end',
            render: (row) => (
              <Button
                type="button"
                variant="danger"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteId(getId(row));
                }}
              >
                {COMMON.delete}
              </Button>
            ),
          },
        ]}
      />

      {collectionDatesDialog ? (
        <div
          className="overlay"
          role="presentation"
          onClick={() => setCollectionDatesDialog(null)}
        >
          <div
            className="modal collection-dates-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-dates-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="collection-dates-title">
              مواعيد الجمع — {collectionDatesDialog.title}
            </h3>
            <p className="muted">{collectionDatesDialog.dates.length} موعد</p>
            <ul className="collection-dates-list">
              {collectionDatesDialog.dates.map((date) => (
                <li key={date}>{date}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <Button type="button" variant="primary" onClick={() => setCollectionDatesDialog(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="حذف الاشتراك"
        description={`هل أنت متأكد من حذف اشتراك «${deleteLabel}»؟ سيتم حذف مهام الجمع المرتبطة وتحرير الصندوق.`}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void onDelete(deleteId).then(() => setDeleteId(null));
        }}
      />
    </div>
  );
}

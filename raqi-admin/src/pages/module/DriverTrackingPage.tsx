import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminApi } from '../../api/modules';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KpiStat } from '../../components/ui/KpiStat';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, formatApiError } from '../../i18n/ar';
import type {
  Area,
  City,
  Customer,
  Driver,
  DriverTaskTrackingRow,
  Plan,
  Subscription,
  Task,
  User,
} from '../../types';
import {
  areaNameById,
  cityNameById,
  customerDisplayName,
  getId,
  planNameById,
  userEmailById,
  userNameById,
  userPhoneById,
} from './shared';
import { driverNameById, taskDate } from './subscriptionUi';

type DriverTrackingPageProps = {
  tasks: Task[];
  drivers: Driver[];
  users: User[];
  customers: Customer[];
  subscriptions: Subscription[];
  plans: Plan[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onRefresh?: () => void;
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function driverLabel(drivers: Driver[], users: User[], driverId: string) {
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  const name = userNameById(users, driver.userId);
  return driver.vehicleNumber ? `${name} (${driver.vehicleNumber})` : name;
}

export function DriverTrackingPage({
  tasks,
  drivers,
  users,
  customers,
  subscriptions,
  plans,
  cities,
  areas,
  loading = false,
  onRefresh,
}: DriverTrackingPageProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIsoDate);
  const [reportLoading, setReportLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<DriverTaskTrackingRow[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [detailsDriverId, setDetailsDriverId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReportLoading(true);
    setError('');
    AdminApi.tasks
      .driverTracking(date)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.drivers);
        setUnassignedTotal(res.data.unassigned.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(formatApiError(err instanceof Error ? err.message : 'Request failed'));
        }
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const driver = drivers.find((item) => getId(item) === row.driverId);
        return {
          ...row,
          driverName: driverLabel(drivers, users, row.driverId),
          cityName: cityNameById(cities, driver?.cityId),
          areaName: areaNameById(areas, driver?.areaId),
          activeLabel: (driver?.status ?? 'active') === 'active' ? 'نشط' : 'معطّل',
        };
      }),
    [areas, cities, drivers, rows, users],
  );

  const details = useMemo(() => {
    if (!detailsDriverId) return null;
    const driver = drivers.find((item) => getId(item) === detailsDriverId);
    const stats = rows.find((row) => row.driverId === detailsDriverId);
    if (!driver) return null;

    const dayTasks = tasks
      .filter((task) => task.driverId === detailsDriverId && taskDate(task) === date)
      .map((task) => {
        const subscription = subscriptions.find(
          (item) => getId(item) === task.subscriptionId,
        );
        const customer = customers.find(
          (item) => getId(item) === (task.customerId ?? subscription?.customerId),
        );
        const area = areas.find((item) => getId(item) === task.areaId);
        return {
          ...task,
          displayDate: taskDate(task),
          areaName: areaNameById(areas, task.areaId),
          cityName: cityNameById(cities, area?.cityId ?? subscription?.cityId),
          customerName: customer ? customerDisplayName(customer, users) : '—',
          customerId: task.customerId ?? subscription?.customerId,
          planName: planNameById(plans, subscription?.planId),
          subscriptionStatus: subscription?.status,
          subscriptionId: task.subscriptionId,
        };
      });

    const subscriptionIds = [
      ...new Set(dayTasks.map((task) => task.subscriptionId).filter(Boolean)),
    ] as string[];

    const linkedSubscriptions = subscriptionIds.map((subscriptionId) => {
      const subscription = subscriptions.find((item) => getId(item) === subscriptionId);
      const customer = customers.find(
        (item) => getId(item) === subscription?.customerId,
      );
      return {
        subscriptionId,
        customerName: customer ? customerDisplayName(customer, users) : '—',
        customerId: subscription?.customerId,
        planName: planNameById(plans, subscription?.planId),
        status: subscription?.status,
        paymentStatus: subscription?.paymentStatus,
        driverName: driverNameById(drivers, users, subscription?.driverId),
      };
    });

    const assignedSubscriptions = subscriptions
      .filter((sub) => sub.driverId === detailsDriverId && sub.status === 'active')
      .map((subscription) => {
        const customer = customers.find(
          (item) => getId(item) === subscription.customerId,
        );
        return {
          subscriptionId: getId(subscription),
          customerName: customer ? customerDisplayName(customer, users) : '—',
          customerId: subscription.customerId,
          planName: planNameById(plans, subscription.planId),
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          driverName: driverNameById(drivers, users, subscription.driverId),
        };
      });

    return {
      driver,
      stats,
      dayTasks,
      linkedSubscriptions,
      assignedSubscriptions,
      name: userNameById(users, driver.userId),
      phone: userPhoneById(users, driver.userId),
      email: userEmailById(users, driver.userId),
    };
  }, [
    areas,
    cities,
    customers,
    date,
    detailsDriverId,
    drivers,
    plans,
    rows,
    subscriptions,
    tasks,
    users,
  ]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          total: acc.total + row.total,
          completed: acc.completed + row.completed,
          inProgress: acc.inProgress + row.inProgress,
          open:
            acc.open +
            row.pending +
            row.assigned +
            row.inProgress,
        }),
        { total: 0, completed: 0, inProgress: 0, open: 0 },
      ),
    [rows],
  );

  function openDetails(driverId: string) {
    setDetailsDriverId(driverId);
  }

  return (
    <div className="module-page">
      <header className="page-header page-header--split">
        <div>
          <h2 className="page-header__title">تتبع السائقين حسب المهام</h2>
          <p className="page-header__description">
            ملخص مهام الجمع لكل سائق في اليوم المحدد ومتابعة التقدم
          </p>
        </div>
        {onRefresh ? (
          <Button type="button" variant="secondary" onClick={() => onRefresh()}>
            تحديث
          </Button>
        ) : null}
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <div className="row-form">
          <Input
            label="تاريخ المهام"
            type="date"
            value={date}
            onChange={(event) => {
              setDetailsDriverId(null);
              setDate(event.target.value);
            }}
          />
        </div>
      </section>

      <section className="kpi-grid kpi-grid--secondary" aria-label="ملخص اليوم">
        <KpiStat label="مهام السائقين" value={totals.total} />
        <KpiStat label="قيد التنفيذ" value={totals.inProgress} />
        <KpiStat label="مكتملة" value={totals.completed} tone="success" />
        <KpiStat
          label="بدون سائق"
          value={unassignedTotal}
          tone={unassignedTotal > 0 ? 'warning' : 'default'}
        />
      </section>

      <DataTable
        title="السائقون"
        description="اضغط على «تفاصيل» لعرض السائق والمهام والاشتراكات"
        rows={tableRows}
        loading={loading || reportLoading}
        disableGlobalSearch
        searchKeys={['driverName', 'cityName', 'areaName', 'activeLabel']}
        columns={[
          { key: 'driverName', label: 'السائق' },
          { key: 'cityName', label: 'المدينة' },
          { key: 'areaName', label: 'المنطقة' },
          { key: 'total', label: 'الإجمالي' },
          { key: 'assigned', label: 'معيّنة' },
          { key: 'inProgress', label: 'جارية' },
          { key: 'completed', label: 'مكتملة' },
          { key: 'skipped', label: 'متخطاة' },
          {
            key: 'actions',
            label: COMMON.actions,
            sortable: false,
            align: 'end',
            render: (row) => (
              <Button
                type="button"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  openDetails(String(row.driverId));
                }}
              >
                تفاصيل
              </Button>
            ),
          },
        ]}
      />

      {details ? (
        <div
          className="overlay"
          role="presentation"
          onClick={() => setDetailsDriverId(null)}
        >
          <div
            className="modal driver-tracking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="driver-tracking-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="driver-tracking-modal__header">
              <div>
                <h3 id="driver-tracking-title">{details.name}</h3>
                <p className="muted">مهام يوم {date}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setDetailsDriverId(null)}>
                إغلاق
              </Button>
            </header>

            <div className="driver-tracking-modal__body">
              <section className="detail-block">
                <h4 className="detail-block__title">السائق والحساب</h4>
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>الاسم</dt>
                    <dd>{details.name}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.phone}</dt>
                    <dd dir="ltr">{details.phone}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.email}</dt>
                    <dd dir="ltr">{details.email}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>رمز السائق</dt>
                    <dd>{details.driver.code ?? '—'}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>المركبة</dt>
                    <dd>{details.driver.vehicleNumber ?? '—'}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.city}</dt>
                    <dd>{cityNameById(cities, details.driver.cityId)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.area}</dt>
                    <dd>{areaNameById(areas, details.driver.areaId)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.status}</dt>
                    <dd>
                      <StatusBadge status={details.driver.status ?? 'active'} />
                    </dd>
                  </div>
                </dl>
              </section>

              {details.stats ? (
                <section className="detail-block">
                  <h4 className="detail-block__title">ملخص مهام اليوم</h4>
                  <div className="driver-tracking-modal__stats">
                    <span>الإجمالي: {details.stats.total}</span>
                    <span>معيّنة: {details.stats.assigned}</span>
                    <span>جارية: {details.stats.inProgress}</span>
                    <span>مكتملة: {details.stats.completed}</span>
                    <span>متخطاة: {details.stats.skipped}</span>
                    <span>ملغاة: {details.stats.cancelled}</span>
                  </div>
                </section>
              ) : null}

              <section className="detail-block">
                <h4 className="detail-block__title">اشتراكات مرتبطة بمهام اليوم</h4>
                {details.linkedSubscriptions.length === 0 ? (
                  <p className="muted">لا توجد اشتراكات مرتبطة بمهام هذا اليوم.</p>
                ) : (
                  <ul className="driver-tracking-modal__list">
                    {details.linkedSubscriptions.map((item) => (
                      <li key={item.subscriptionId} className="driver-tracking-modal__card">
                        <div>
                          <strong>{item.customerName}</strong>
                          <p className="muted">{item.planName}</p>
                        </div>
                        <div className="driver-tracking-modal__card-meta">
                          <StatusBadge status={String(item.status)} />
                          <StatusBadge status={String(item.paymentStatus)} />
                        </div>
                        <div className="driver-tracking-modal__card-actions">
                          {item.customerId ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setDetailsDriverId(null);
                                navigate(`/customers/${item.customerId}`);
                              }}
                            >
                              العميل
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setDetailsDriverId(null);
                              navigate(`/subscriptions/${item.subscriptionId}`);
                            }}
                          >
                            الاشتراك
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {details.assignedSubscriptions.length > 0 ? (
                <section className="detail-block">
                  <h4 className="detail-block__title">اشتراكات نشطة معيّنة للسائق</h4>
                  <ul className="driver-tracking-modal__list">
                    {details.assignedSubscriptions.map((item) => (
                      <li key={`assigned-${item.subscriptionId}`} className="driver-tracking-modal__card">
                        <div>
                          <strong>{item.customerName}</strong>
                          <p className="muted">{item.planName}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setDetailsDriverId(null);
                            navigate(`/subscriptions/${item.subscriptionId}`);
                          }}
                        >
                          فتح الاشتراك
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="detail-block">
                <h4 className="detail-block__title">مهام اليوم ({details.dayTasks.length})</h4>
                {details.dayTasks.length === 0 ? (
                  <p className="muted">لا توجد مهام في هذا اليوم.</p>
                ) : (
                  <ul className="driver-tracking-modal__list">
                    {details.dayTasks.map((task) => (
                      <li key={getId(task)} className="driver-tracking-modal__card">
                        <div>
                          <strong>{task.customerName}</strong>
                          <p className="muted">
                            {task.cityName} — {task.areaName} · {task.planName}
                          </p>
                          <p className="muted">اشتراك: {task.subscriptionId ?? '—'}</p>
                        </div>
                        <StatusBadge status={String(task.status)} />
                        {task.subscriptionId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setDetailsDriverId(null);
                              navigate(`/subscriptions/${task.subscriptionId}`);
                            }}
                          >
                            الاشتراك
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <footer className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDetailsDriverId(null);
                  navigate(`/drivers/${getId(details.driver)}`);
                }}
              >
                ملف السائق
              </Button>
              <Button type="button" variant="primary" onClick={() => setDetailsDriverId(null)}>
                إغلاق
              </Button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

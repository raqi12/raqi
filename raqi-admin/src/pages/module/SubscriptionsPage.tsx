import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, CUSTOMER_TYPES } from '../../i18n/ar';
import type {
  Address,
  Area,
  Bin,
  City,
  Customer,
  Driver,
  Payment,
  Plan,
  Subscription,
  Task,
  User,
} from '../../types';
import {
  addressLocationLabel,
  areaNameById,
  binCodeById,
  cityNameById,
  customerDisplayName,
  getId,
  planNameById,
  userNameById,
} from './shared';

type SubscriptionsPageProps = {
  subscriptions: Subscription[];
  plans: Plan[];
  bins: Bin[];
  customers: Customer[];
  users: User[];
  drivers: Driver[];
  tasks: Task[];
  payments: Payment[];
  areas: Area[];
  cities: City[];
  loading?: boolean;
  onLoadAddresses: (customerId: string) => Promise<Address[]>;
  onCreate: (body: {
    customerId: string;
    planId?: string;
    addressId: string;
    binId?: string;
    paymentStatus?: 'paid' | 'unpaid';
  }) => Promise<void>;
  onAssignDriver: (id: string, driverId: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onSuspend: (id: string) => Promise<void>;
  onRenew: (id: string) => Promise<void>;
};

const emptyForm = {
  customerId: '',
  planId: '',
  addressId: '',
  binId: '',
  paymentStatus: 'unpaid' as 'paid' | 'unpaid',
};

const PLAN_FREQUENCY: Record<string, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  custom: 'مخصص',
};

type PendingAction = 'activate' | 'suspend' | 'renew';

function customerOptionLabel(customer: Customer, users: User[]) {
  const name = customerDisplayName(customer, users);
  const type = CUSTOMER_TYPES[customer.type ?? ''] ?? customer.type ?? '—';
  return `${name} — ${type}`;
}

function driverNameById(drivers: Driver[], users: User[], driverId?: string) {
  if (!driverId) return '—';
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  const name = userNameById(users, driver.userId);
  return driver.vehicleNumber ? `${name} (${driver.vehicleNumber})` : name;
}

function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
}

function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '—';
}

function RecordList({ empty, children }: { empty: string; children: ReactNode }) {
  if (!children) {
    return <p className="detail-block__muted">{empty}</p>;
  }
  return <ul className="record-list">{children}</ul>;
}

export function SubscriptionsPage({
  subscriptions,
  plans,
  bins,
  customers,
  users,
  drivers,
  tasks,
  payments,
  areas,
  cities,
  loading = false,
  onLoadAddresses,
  onCreate,
  onAssignDriver,
  onActivate,
  onSuspend,
  onRenew,
}: SubscriptionsPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [detailAddress, setDetailAddress] = useState<Address | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [confirm, setConfirm] = useState<{ id: string; action: PendingAction } | null>(null);
  const [saving, setSaving] = useState(false);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active !== false), [plans]);
  const availableBins = useMemo(() => bins.filter((bin) => bin.status === 'available'), [bins]);

  const tableRows = useMemo(
    () =>
      subscriptions.map((subscription) => {
        const customer = customers.find((item) => getId(item) === subscription.customerId);
        return {
          ...subscription,
          customerName: customer ? customerOptionLabel(customer, users) : '—',
          planName: planNameById(plans, subscription.planId),
          binCode: binCodeById(bins, subscription.binId),
          cityName: cityNameById(cities, subscription.cityId),
          areaName: areaNameById(areas, subscription.areaId),
          driverName: driverNameById(drivers, users, subscription.driverId),
        };
      }),
    [areas, bins, cities, customers, drivers, plans, subscriptions, users],
  );

  const selectedDrivers = useMemo(() => {
    if (!selected?.cityId || !selected?.areaId) return [];
    return drivers.filter(
      (driver) =>
        driver.status === 'active' &&
        driver.cityId === selected.cityId &&
        driver.areaId === selected.areaId,
    );
  }, [drivers, selected?.areaId, selected?.cityId]);

  const detailCustomer = useMemo(
    () =>
      selected
        ? customers.find((customer) => getId(customer) === selected.customerId)
        : undefined,
    [customers, selected],
  );

  const detailPlan = useMemo(
    () => (selected ? plans.find((plan) => getId(plan) === selected.planId) : undefined),
    [plans, selected],
  );

  const detailBin = useMemo(
    () => (selected ? bins.find((bin) => getId(bin) === selected.binId) : undefined),
    [bins, selected],
  );

  const relatedTasks = useMemo(() => {
    if (!selected) return [];
    const subscriptionId = getId(selected);
    return tasks.filter((task) => getId(task) && task.subscriptionId === subscriptionId);
  }, [selected, tasks]);

  const relatedPayments = useMemo(() => {
    if (!selected) return [];
    const subscriptionId = getId(selected);
    return payments.filter((payment) => payment.subscriptionId === subscriptionId);
  }, [payments, selected]);

  useEffect(() => {
    if (!form.customerId) {
      setAddresses([]);
      return;
    }
    setAddressesLoading(true);
    void onLoadAddresses(form.customerId)
      .then((items) => {
        setAddresses(items);
        setForm((prev) => ({
          ...prev,
          addressId: items.some((address) => getId(address) === prev.addressId) ? prev.addressId : '',
        }));
      })
      .finally(() => setAddressesLoading(false));
  }, [form.customerId, onLoadAddresses]);

  useEffect(() => {
    if (!selected) {
      setDetailAddress(null);
      setAssignDriverId('');
      return;
    }
    const updated = subscriptions.find((item) => getId(item) === getId(selected));
    if (updated) {
      setSelected(updated);
    }
    setAssignDriverId(selected.driverId ?? '');

    if (!selected.customerId) {
      setDetailAddress(null);
      return;
    }

    setDetailLoading(true);
    void onLoadAddresses(selected.customerId)
      .then((items) => {
        const address = items.find((item) => getId(item) === selected.addressId) ?? null;
        setDetailAddress(address);
      })
      .finally(() => setDetailLoading(false));
  }, [onLoadAddresses, selected?.id, selected?._id, subscriptions]);

  function handleCustomerChange(customerId: string) {
    setForm({
      ...emptyForm,
      customerId,
      paymentStatus: 'unpaid',
    });
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.addressId) return;
    setSaving(true);
    try {
      await onCreate({
        customerId: form.customerId,
        planId: form.planId || undefined,
        addressId: form.addressId,
        binId: form.binId || undefined,
        paymentStatus: form.paymentStatus,
      });
      setForm(emptyForm);
      setAddresses([]);
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignDriver(e: FormEvent) {
    e.preventDefault();
    if (!selected || !assignDriverId) return;
    setSaving(true);
    try {
      await onAssignDriver(getId(selected), assignDriverId);
    } finally {
      setSaving(false);
    }
  }

  async function runConfirmedAction() {
    if (!confirm) return;
    setSaving(true);
    try {
      if (confirm.action === 'activate') await onActivate(confirm.id);
      if (confirm.action === 'suspend') await onSuspend(confirm.id);
      if (confirm.action === 'renew') await onRenew(confirm.id);
      setConfirm(null);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  const confirmCopy: Record<PendingAction, { title: string; description: string }> = {
    activate: {
      title: 'تفعيل الاشتراك',
      description: 'هل تريد تفعيل هذا الاشتراك؟ يجب أن تكون الخطة والعنوان والصندوق والدفع مكتملة.',
    },
    suspend: {
      title: 'إيقاف الاشتراك',
      description: 'هل تريد إيقاف هذا الاشتراك مؤقتًا؟',
    },
    renew: {
      title: 'تجديد الاشتراك',
      description: 'هل تريد تجديد هذا الاشتراك للفترة التالية؟',
    },
  };

  const panelTitle = selected ? planNameById(plans, selected.planId) : '';
  const panelSubtitle = detailCustomer
    ? customerDisplayName(detailCustomer, users)
    : undefined;

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إنشاء اشتراك"
        description="أنشئ اشتراكًا جديدًا واربطه بالعميل والخطة والعنوان والصندوق"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Select
            label="العميل"
            value={form.customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            required
          >
            <option value="">اختر العميل</option>
            {customers.map((customer) => (
              <option key={getId(customer)} value={getId(customer)}>
                {customerOptionLabel(customer, users)}
              </option>
            ))}
          </Select>
          <Select
            label="الخطة"
            value={form.planId}
            onChange={(e) => setForm({ ...form, planId: e.target.value })}
          >
            <option value="">اختر الخطة (اختياري)</option>
            {activePlans.map((plan) => (
              <option key={getId(plan)} value={getId(plan)}>
                {plan.name} — {plan.price} د.ل ({plan.numberOfCollections ?? 0} جمع)
              </option>
            ))}
          </Select>
          <Select
            label="العنوان"
            value={form.addressId}
            onChange={(e) => setForm({ ...form, addressId: e.target.value })}
            disabled={!form.customerId || addressesLoading}
            required
          >
            <option value="">
              {addressesLoading ? COMMON.loading : 'اختر العنوان'}
            </option>
            {addresses.map((address) => (
              <option key={getId(address)} value={getId(address)}>
                {address.label} — {addressLocationLabel(address, cities, areas)}
                {address.isActive ? ' (نشط)' : ''}
              </option>
            ))}
          </Select>
          <Select
            label="الصندوق"
            value={form.binId}
            onChange={(e) => setForm({ ...form, binId: e.target.value })}
          >
            <option value="">اختر الصندوق (اختياري)</option>
            {availableBins.map((bin) => (
              <option key={getId(bin)} value={getId(bin)}>
                {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر)
              </option>
            ))}
          </Select>
          <Select
            label="حالة الدفع"
            value={form.paymentStatus}
            onChange={(e) =>
              setForm({ ...form, paymentStatus: e.target.value as 'paid' | 'unpaid' })
            }
          >
            <option value="unpaid">غير مدفوع</option>
            <option value="paid">مدفوع</option>
          </Select>
        </div>
        {!customers.length ? (
          <p className="field__hint">أضف عملاء أولًا من صفحة العملاء.</p>
        ) : null}
        {form.customerId && !addressesLoading && !addresses.length ? (
          <p className="field__hint">لا توجد عناوين لهذا العميل. أضف عنوانًا من صفحة العملاء.</p>
        ) : null}
      </FormCard>

      <DataTable
        title="الاشتراكات"
        description="متابعة اشتراكات العملاء وحالات الدفع والتفعيل"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['customerName', 'planName', 'cityName', 'areaName', 'driverName', 'status', 'paymentStatus']}
        columns={[
          { key: 'customerName', label: 'العميل' },
          { key: 'planName', label: 'الخطة' },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
          { key: 'driverName', label: 'السائق' },
          { key: 'binCode', label: 'الصندوق' },
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
        ]}
      />

      {selected ? (
        <DetailPanel
          title={panelTitle}
          subtitle={panelSubtitle}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات العميل</h4>
              {detailCustomer ? (
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>{COMMON.name}</dt>
                    <dd>{customerDisplayName(detailCustomer, users)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.email}</dt>
                    <dd dir="ltr">{detailCustomer.email ?? '—'}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.type}</dt>
                    <dd>
                      {CUSTOMER_TYPES[detailCustomer.type ?? ''] ?? detailCustomer.type ?? '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="detail-block__muted">—</p>
              )}
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">معلومات الاشتراك</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>{COMMON.status}</dt>
                  <dd>
                    <StatusBadge status={selected.status ?? 'draft'} />
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>الدفع</dt>
                  <dd>
                    <StatusBadge status={selected.paymentStatus ?? 'unpaid'} />
                  </dd>
                </div>
                <div className="info-list__row">
                  <dt>الخطة</dt>
                  <dd>{planNameById(plans, selected.planId)}</dd>
                </div>
                {detailPlan ? (
                  <>
                    <div className="info-list__row">
                      <dt>سعر الخطة</dt>
                      <dd>{formatMoney(detailPlan.price)}</dd>
                    </div>
                    <div className="info-list__row">
                      <dt>التكرار</dt>
                      <dd>
                        {PLAN_FREQUENCY[detailPlan.frequency ?? ''] ?? detailPlan.frequency ?? '—'}
                      </dd>
                    </div>
                    <div className="info-list__row">
                      <dt>عدد الجمعات</dt>
                      <dd>{detailPlan.numberOfCollections ?? '—'}</dd>
                    </div>
                    <div className="info-list__row">
                      <dt>مدة الاشتراك</dt>
                      <dd>{detailPlan.durationDays ? `${detailPlan.durationDays} يوم` : '—'}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">الموقع والعنوان</h4>
              {detailLoading ? (
                <p className="detail-block__muted">{COMMON.loading}</p>
              ) : (
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>{COMMON.city}</dt>
                    <dd>{cityNameById(cities, selected.cityId)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.area}</dt>
                    <dd>{areaNameById(areas, selected.areaId)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>العنوان</dt>
                    <dd>
                      {detailAddress ? (
                        <>
                          {detailAddress.label}
                          {detailAddress.isActive ? ' (نشط)' : ''}
                        </>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  {detailAddress ? (
                    <div className="info-list__row">
                      <dt>تفاصيل العنوان</dt>
                      <dd>
                        {addressLocationLabel(detailAddress, cities, areas)}
                        {detailAddress.details ? ` — ${detailAddress.details}` : ''}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">الصندوق والسائق</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>الصندوق</dt>
                  <dd>{binCodeById(bins, selected.binId)}</dd>
                </div>
                {detailBin ? (
                  <>
                    <div className="info-list__row">
                      <dt>سعة الصندوق</dt>
                      <dd>{detailBin.capacity ?? 0} لتر</dd>
                    </div>
                    <div className="info-list__row">
                      <dt>حالة الصندوق</dt>
                      <dd>
                        <StatusBadge status={String(detailBin.status)} />
                      </dd>
                    </div>
                  </>
                ) : null}
                <div className="info-list__row">
                  <dt>السائق المعيّن</dt>
                  <dd>{driverNameById(drivers, users, selected.driverId)}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">تعيين السائق</h4>
              {!selected.cityId || !selected.areaId ? (
                <p className="field__hint">
                  يجب ربط الاشتراك بعنوان له مدينة ومنطقة قبل تعيين سائق.
                </p>
              ) : (
                <form className="detail-form" onSubmit={submitAssignDriver}>
                  <Select
                    label="السائق"
                    value={assignDriverId}
                    onChange={(e) => setAssignDriverId(e.target.value)}
                    required
                  >
                    <option value="">اختر السائق</option>
                    {selectedDrivers.map((driver) => (
                      <option key={getId(driver)} value={getId(driver)}>
                        {userNameById(users, driver.userId)} — {driver.vehicleNumber ?? '—'}
                      </option>
                    ))}
                  </Select>
                  {!selectedDrivers.length ? (
                    <p className="field__hint">لا يوجد سائقون نشطون يخدمون هذه المنطقة.</p>
                  ) : null}
                  <Button type="submit" disabled={saving || !assignDriverId}>
                    تعيين السائق
                  </Button>
                </form>
              )}
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">مهام الجمع ({relatedTasks.length})</h4>
              <RecordList empty="لا توجد مهام مرتبطة بهذا الاشتراك.">
                {relatedTasks.length > 0
                  ? relatedTasks.map((task) => (
                      <li key={getId(task)} className="record-list__item">
                        <div className="record-list__header">
                          <strong>{taskDate(task)}</strong>
                          <StatusBadge status={String(task.status)} />
                        </div>
                        <div className="record-list__meta">
                          <span>{areaNameById(areas, task.areaId)}</span>
                          <span>
                            السائق: {driverNameById(drivers, users, task.driverId)}
                          </span>
                        </div>
                      </li>
                    ))
                  : null}
              </RecordList>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">المدفوعات ({relatedPayments.length})</h4>
              <RecordList empty="لا توجد مدفوعات مرتبطة بهذا الاشتراك.">
                {relatedPayments.length > 0
                  ? relatedPayments.map((payment) => (
                      <li key={getId(payment)} className="record-list__item">
                        <div className="record-list__header">
                          <strong>{formatMoney(payment.amount)}</strong>
                          <StatusBadge status={String(payment.status ?? 'pending')} />
                        </div>
                        <div className="record-list__meta">
                          <span>الطريقة: {payment.method ?? '—'}</span>
                        </div>
                      </li>
                    ))
                  : null}
              </RecordList>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">{COMMON.actions}</h4>
              <div className="detail-actions">
                <Button
                  type="button"
                  onClick={() => setConfirm({ id: getId(selected), action: 'activate' })}
                  disabled={saving || selected.status === 'active'}
                >
                  تفعيل
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirm({ id: getId(selected), action: 'suspend' })}
                  disabled={saving || selected.status === 'suspended'}
                >
                  إيقاف
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirm({ id: getId(selected), action: 'renew' })}
                  disabled={saving}
                >
                  تجديد
                </Button>
              </div>
            </section>
          </div>
        </DetailPanel>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm ? confirmCopy[confirm.action].title : ''}
        description={confirm ? confirmCopy[confirm.action].description : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />
    </div>
  );
}

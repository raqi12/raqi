import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminApi } from '../../api/modules';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
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
  SubscriptionCost,
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
  onUpdate: (
    id: string,
    body: {
      planId?: string;
      addressId?: string;
      binId?: string;
      paymentStatus?: 'paid' | 'unpaid';
    },
  ) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onSuspend: (id: string) => Promise<void>;
  onRenew: (id: string) => Promise<void>;
  onReplaceBin: (id: string, newBinId: string) => Promise<void>;
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
  return customerDisplayName(customer, users);
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

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-LY');
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

function displayOrMissing(value?: string | null, missing = 'غير محدد') {
  return value && value !== '—' ? value : missing;
}

function subscriptionActivationReadiness(subscription: Subscription) {
  return {
    plan: Boolean(subscription.planId),
    address: Boolean(subscription.addressId && subscription.cityId && subscription.areaId),
    payment: subscription.paymentStatus === 'paid',
  };
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
  onUpdate,
  onActivate,
  onSuspend,
  onRenew,
  onReplaceBin,
}: SubscriptionsPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [detailAddress, setDetailAddress] = useState<Address | null>(null);
  const [detailAddresses, setDetailAddresses] = useState<Address[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    planId: '',
    addressId: '',
    binId: '',
    paymentStatus: 'unpaid' as 'paid' | 'unpaid',
  });
  const [assignDriverId, setAssignDriverId] = useState('');
  const [replaceBinId, setReplaceBinId] = useState('');
  const [confirm, setConfirm] = useState<{ id: string; action: PendingAction } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formCost, setFormCost] = useState<SubscriptionCost | null>(null);
  const [editCost, setEditCost] = useState<SubscriptionCost | null>(null);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active !== false), [plans]);
  const availableBins = useMemo(() => bins.filter((bin) => bin.status === 'available'), [bins]);
  const editBins = useMemo(() => {
    if (!selected?.binId) return availableBins;
    const current = bins.find((bin) => getId(bin) === selected.binId);
    if (!current || availableBins.some((bin) => getId(bin) === getId(current))) {
      return availableBins;
    }
    return [current, ...availableBins];
  }, [availableBins, bins, selected?.binId]);

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
    // #region agent log
    fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'SubscriptionsPage.tsx:edit-form-effect',message:'SubscriptionsPage edit form reset effect ran',data:{selectedId:selected?getId(selected):null},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    if (!selected) {
      setDetailAddress(null);
      setDetailAddresses([]);
      setEditForm({ planId: '', addressId: '', binId: '', paymentStatus: 'unpaid' });
      setAssignDriverId('');
      setReplaceBinId('');
      return;
    }
    setAssignDriverId(selected.driverId ?? '');
    setEditForm({
      planId: selected.planId ?? '',
      addressId: selected.addressId ?? '',
      binId: selected.binId ?? '',
      paymentStatus: selected.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    });
  }, [selected?.id, selected?._id]);

  useEffect(() => {
    if (!selected) return;
    const updated = subscriptions.find((item) => getId(item) === getId(selected));
    if (updated) {
      setSelected((current) => {
        if (!current || getId(current) !== getId(updated)) return current;
        return { ...current, ...updated };
      });
    }
  }, [subscriptions, selected?.id, selected?._id]);

  useEffect(() => {
    if (!selected?.customerId) {
      setDetailAddress(null);
      return;
    }

    setDetailLoading(true);
    void onLoadAddresses(selected.customerId)
      .then((items) => {
        setDetailAddresses(items);
        const address =
          items.find((item) => getId(item) === selected.addressId) ?? null;
        setDetailAddress(address);
      })
      .finally(() => setDetailLoading(false));
  }, [onLoadAddresses, selected?.addressId, selected?.customerId]);

  useEffect(() => {
    if (!form.planId) {
      setFormCost(null);
      return;
    }
    void AdminApi.plans
      .cost(form.planId, form.binId || undefined)
      .then((response) => setFormCost(response.data))
      .catch(() => setFormCost(null));
  }, [form.planId, form.binId]);

  useEffect(() => {
    if (!editForm.planId) {
      setEditCost(null);
      return;
    }
    void AdminApi.plans
      .cost(editForm.planId, editForm.binId || undefined)
      .then((response) => setEditCost(response.data))
      .catch(() => setEditCost(null));
  }, [editForm.planId, editForm.binId]);

  function handleCustomerChange(customerId: string) {
    setForm({
      ...emptyForm,
      customerId,
      paymentStatus: 'unpaid',
    });
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.addressId || !form.planId) return;
    setSaving(true);
    try {
      await onCreate({
        customerId: form.customerId,
        planId: form.planId,
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

  async function submitReplaceBin(e: FormEvent) {
    e.preventDefault();
    if (!selected || !replaceBinId) return;
    setSaving(true);
    try {
      await onReplaceBin(getId(selected), replaceBinId);
      setReplaceBinId('');
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected || !editForm.planId || !editForm.addressId) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), {
        planId: editForm.planId,
        addressId: editForm.addressId,
        binId: editForm.binId || undefined,
        paymentStatus: editForm.paymentStatus,
      });
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

  const panelTitle = selected
    ? selected.planId
      ? planNameById(plans, selected.planId)
      : `اشتراك ${selected.status === 'draft' ? 'مسودة' : selected.status ?? '—'}`
    : '';
  const panelSubtitle = detailCustomer
    ? customerDisplayName(detailCustomer, users)
    : undefined;
  const readiness = selected ? subscriptionActivationReadiness(selected) : null;
  const canActivate = readiness
    ? readiness.plan && readiness.address && readiness.payment
    : false;

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
            required
          >
            <option value="">اختر الخطة</option>
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
            <option value="">بدون حاوية</option>
            {availableBins.map((bin) => (
              <option key={getId(bin)} value={getId(bin)}>
                {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر
                {bin.fee ? ` — ${bin.fee} د.ل` : ''})
              </option>
            ))}
          </Select>
          {formCost ? (
            <p className="field__hint">
              التكلفة: {formatMoney(formCost.planPrice)} خطة
              {formCost.binFee > 0 ? ` + ${formatMoney(formCost.binFee)} حاوية` : ''}
              {' '}= {formatMoney(formCost.total)}
            </p>
          ) : null}
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
            {readiness && selected.status !== 'active' ? (
              <section className="detail-block">
                <h4 className="detail-block__title">جاهزية التفعيل</h4>
                <ul className="readiness-list">
                  <li className={readiness.plan ? 'readiness-list__item--ok' : 'readiness-list__item--missing'}>
                    الخطة {readiness.plan ? '✓' : '— مطلوبة'}
                  </li>
                  <li className={readiness.address ? 'readiness-list__item--ok' : 'readiness-list__item--missing'}>
                    العنوان والموقع {readiness.address ? '✓' : '— مطلوب'}
                  </li>
                  <li className={readiness.payment ? 'readiness-list__item--ok' : 'readiness-list__item--missing'}>
                    الدفع {readiness.payment ? '✓' : '— يجب أن يكون مدفوعًا'}
                  </li>
                </ul>
                {!canActivate ? (
                  <p className="field__hint">
                    أكمل العناصر الناقصة أدناه أو من صفحة العميل (تعيين اشتراك).
                  </p>
                ) : null}
              </section>
            ) : null}

            {selected.status === 'draft' || selected.status === 'requested' ? (
              <section className="detail-block">
                <h4 className="detail-block__title">إكمال الاشتراك</h4>
                <form className="detail-form" onSubmit={submitUpdate}>
                  <Select
                    label="الخطة"
                    value={editForm.planId}
                    onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                    required
                  >
                    <option value="">اختر الخطة</option>
                    {activePlans.map((plan) => (
                      <option key={getId(plan)} value={getId(plan)}>
                        {plan.name} — {plan.price} د.ل ({plan.numberOfCollections ?? 0} جمع)
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="العنوان"
                    value={editForm.addressId}
                    onChange={(e) => setEditForm({ ...editForm, addressId: e.target.value })}
                    disabled={detailLoading || !detailAddresses.length}
                    required
                  >
                    <option value="">
                      {detailLoading ? COMMON.loading : 'اختر العنوان'}
                    </option>
                    {detailAddresses.map((address) => (
                      <option key={getId(address)} value={getId(address)}>
                        {address.label} — {addressLocationLabel(address, cities, areas)}
                        {address.isActive ? ' (نشط)' : ''}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="الصندوق"
                    value={editForm.binId}
                    onChange={(e) => setEditForm({ ...editForm, binId: e.target.value })}
                  >
                    <option value="">بدون حاوية</option>
                    {editBins.map((bin) => (
                      <option key={getId(bin)} value={getId(bin)}>
                        {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر
                        {bin.fee ? ` — ${bin.fee} د.ل` : ''})
                      </option>
                    ))}
                  </Select>
                  {editCost ? (
                    <p className="field__hint">
                      التكلفة: {formatMoney(editCost.planPrice)} خطة
                      {editCost.binFee > 0 ? ` + ${formatMoney(editCost.binFee)} حاوية` : ''}
                      {' '}= {formatMoney(editCost.total)}
                    </p>
                  ) : null}
                  <Select
                    label="حالة الدفع"
                    value={editForm.paymentStatus}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        paymentStatus: e.target.value as 'paid' | 'unpaid',
                      })
                    }
                  >
                    <option value="unpaid">غير مدفوع</option>
                    <option value="paid">مدفوع</option>
                  </Select>
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      detailLoading ||
                      !editForm.planId ||
                      !editForm.addressId
                    }
                  >
                    حفظ التعديلات
                  </Button>
                </form>
              </section>
            ) : null}

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
                  <dt>التجديد التلقائي</dt>
                  <dd>{selected.autoRenew ? 'مفعّل' : 'معطّل'}</dd>
                </div>
                <div className="info-list__row">
                  <dt>تاريخ الانتهاء</dt>
                  <dd>{formatDateTime(selected.expiresAt)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>آخر تجديد</dt>
                  <dd>{formatDateTime(selected.renewedAt)}</dd>
                </div>
                {selected.renewalGraceUntil ? (
                  <div className="info-list__row">
                    <dt>فترة السماح</dt>
                    <dd>{formatDateTime(selected.renewalGraceUntil)}</dd>
                  </div>
                ) : null}
                <div className="info-list__row">
                  <dt>الخطة</dt>
                  <dd>{displayOrMissing(planNameById(plans, selected.planId))}</dd>
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
                <div className="info-list__row">
                  <dt>مواعيد الجمع</dt>
                  <dd dir="ltr">
                    {selected.collectionDates?.length
                      ? selected.collectionDates.join(', ')
                      : '—'}
                  </dd>
                </div>
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
                  <dd>{displayOrMissing(binCodeById(bins, selected.binId))}</dd>
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
                    <div className="info-list__row">
                      <dt>تاريخ التوصيل</dt>
                      <dd dir="ltr">{detailBin.deliveryDate ?? '—'}</dd>
                    </div>
                  </>
                ) : null}
                <div className="info-list__row">
                  <dt>السائق المعيّن</dt>
                  <dd>
                    {selected.driverId
                      ? driverNameById(drivers, users, selected.driverId)
                      : 'غير معيّن (اختياري)'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">استبدال الصندوق</h4>
              {selected.status !== 'active' ? (
                <p className="field__hint">يمكن استبدال الصندوق للاشتراكات النشطة فقط.</p>
              ) : (
                <form className="detail-form" onSubmit={(e) => void submitReplaceBin(e)}>
                  <Select
                    label="صندوق جديد"
                    value={replaceBinId}
                    onChange={(e) => setReplaceBinId(e.target.value)}
                    required
                  >
                    <option value="">اختر صندوقاً متاحاً</option>
                    {availableBins.map((bin) => (
                      <option key={getId(bin)} value={getId(bin)}>
                        {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر
                        {bin.fee ? ` — ${bin.fee} د.ل` : ''})
                      </option>
                    ))}
                  </Select>
                  {!availableBins.length ? (
                    <p className="field__hint">لا توجد صناديق متاحة للاستبدال.</p>
                  ) : (
                    <p className="field__hint">
                      تاريخ التوصيل يبقى تاريخ بداية الاشتراك. لا يتم خصم رسوم إضافية.
                    </p>
                  )}
                  <Button type="submit" disabled={saving || !replaceBinId || !availableBins.length}>
                    استبدال الصندوق
                  </Button>
                </form>
              )}
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
                  disabled={saving || selected.status === 'active' || !canActivate}
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

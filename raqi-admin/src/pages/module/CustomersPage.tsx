import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminApi } from '../../api/modules';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type {
  Address,
  Area,
  Bin,
  City,
  Complaint,
  Customer,
  CustomerDetails,
  DepositRequest,
  Driver,
  Payment,
  Plan,
  Subscription,
  SubscriptionCost,
  Task,
  User,
  WalletTransaction,
} from '../../types';
import {
  addressLocationLabel,
  areaNameById,
  areasForCity,
  binCodeById,
  cityNameById,
  customerDisplayName,
  getId,
  planNameById,
  userNameById,
} from './shared';

type CustomersPageProps = {
  customers: Customer[];
  users: User[];
  drivers: Driver[];
  plans: Plan[];
  bins: Bin[];
  cities: City[];
  areas: Area[];
  loading?: boolean;
  onCreate: (body: {
    email: string;
    name: string;
    password: string;
    cityId: string;
    areaId: string;
  }) => Promise<void>;
  onLoadDetails: (id: string) => Promise<CustomerDetails>;
  onDeposit: (id: string, amount: number) => Promise<void>;
  onAssignPlan: (body: {
    customerId: string;
    planId: string;
    binId?: string;
    addressId: string;
    collectionDates: string[];
    deductWallet?: boolean;
  }) => Promise<void>;
};

const emptyForm = {
  email: '',
  name: '',
  password: '',
  cityId: '',
  areaId: '',
};

function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
}

const WALLET_TRANSACTION_LABELS: Record<string, string> = {
  deposit: 'إيداع',
  admin_credit: 'إضافة إدارية',
  subscription_payment: 'دفع اشتراك',
  refund: 'استرداد',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

function taskDate(task: Task) {
  return task.scheduledDate?.slice(0, 10) ?? task.date?.slice(0, 10) ?? '—';
}

function driverNameById(drivers: Driver[], users: User[], driverId?: string) {
  if (!driverId) return '—';
  const driver = drivers.find((item) => getId(item) === driverId);
  if (!driver) return '—';
  return userNameById(users, driver.userId);
}

function RecordList({
  empty,
  children,
}: {
  empty: string;
  children: ReactNode;
}) {
  if (!children) {
    return <p className="detail-block__muted">{empty}</p>;
  }
  return <ul className="record-list">{children}</ul>;
}

export function CustomersPage({
  customers,
  users,
  drivers,
  plans,
  bins,
  cities,
  areas,
  loading = false,
  onCreate,
  onLoadDetails,
  onDeposit,
  onAssignPlan,
}: CustomersPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [assignForm, setAssignForm] = useState({
    planId: '',
    binId: '',
    addressId: '',
    deductWallet: false,
    collectionDates: [] as string[],
  });
  const [collectionDateDraft, setCollectionDateDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignCost, setAssignCost] = useState<SubscriptionCost | null>(null);

  const formAreas = useMemo(() => areasForCity(areas, form.cityId), [areas, form.cityId]);
  const hasLocations = cities.length > 0 && areas.length > 0;
  const availableBins = useMemo(
    () => bins.filter((bin) => bin.status === 'available'),
    [bins],
  );
  const selectedPlan = useMemo(
    () => plans.find((plan) => getId(plan) === assignForm.planId) ?? null,
    [assignForm.planId, plans],
  );
  const requiredCollections = selectedPlan?.numberOfCollections ?? 0;

  const tableRows = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        customerName: customerDisplayName(customer, users),
        email: customer.email ?? '—',
        cityName: cityNameById(cities, customer.cityId),
        areaName: areaNameById(areas, customer.areaId),
      })),
    [areas, cities, customers, users],
  );

  const reloadDetails = (customerId: string) => {
    setDetailsLoading(true);
    return onLoadDetails(customerId)
      .then((data) => {
        setDetails(data);
      })
      .finally(() => setDetailsLoading(false));
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'CustomersPage.tsx:details-effect',message:'CustomersPage details effect ran',data:{selectedId:selected?getId(selected):null,hasOnLoadDetails:Boolean(onLoadDetails)},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    if (!selected) {
      setDetails(null);
      setAssignForm({
        planId: '',
        binId: '',
        addressId: '',
        deductWallet: false,
        collectionDates: [],
      });
      setCollectionDateDraft('');
      setDepositAmount('');
      return;
    }
    void reloadDetails(getId(selected));
  }, [onLoadDetails, selected?.id, selected?._id]);

  useEffect(() => {
    if (!assignForm.planId) {
      setAssignCost(null);
      return;
    }
    void AdminApi.plans
      .cost(assignForm.planId, assignForm.binId || undefined)
      .then((response) => setAssignCost(response.data))
      .catch(() => setAssignCost(null));
  }, [assignForm.planId, assignForm.binId]);

  function handleCityChange(cityId: string) {
    setForm((prev) => ({ ...prev, cityId, areaId: '' }));
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.cityId || !form.areaId) return;
    setSaving(true);
    try {
      await onCreate(form);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function submitDeposit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await onDeposit(getId(selected), amount);
      setDepositAmount('');
      await reloadDetails(getId(selected));
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignPlan(e: FormEvent) {
    e.preventDefault();
    if (!selected || !assignForm.planId || !assignForm.addressId) return;
    if (
      !requiredCollections ||
      assignForm.collectionDates.length !== requiredCollections
    ) {
      return;
    }
    setSaving(true);
    try {
      await onAssignPlan({
        customerId: getId(selected),
        planId: assignForm.planId,
        binId: assignForm.binId || undefined,
        addressId: assignForm.addressId,
        collectionDates: [...assignForm.collectionDates].sort(),
        deductWallet: assignForm.deductWallet,
      });
      setAssignForm({
        planId: '',
        binId: '',
        addressId: '',
        deductWallet: false,
        collectionDates: [],
      });
      setCollectionDateDraft('');
      await reloadDetails(getId(selected));
    } finally {
      setSaving(false);
    }
  }

  function addCollectionDate() {
    if (!collectionDateDraft) return;
    if (assignForm.collectionDates.includes(collectionDateDraft)) return;
    if (requiredCollections && assignForm.collectionDates.length >= requiredCollections) {
      return;
    }
    setAssignForm({
      ...assignForm,
      collectionDates: [...assignForm.collectionDates, collectionDateDraft].sort(),
    });
    setCollectionDateDraft('');
  }

  function removeCollectionDate(date: string) {
    setAssignForm({
      ...assignForm,
      collectionDates: assignForm.collectionDates.filter((item) => item !== date),
    });
  }

  const selectedCustomer = details?.customer ?? selected;
  const selectedName = selectedCustomer
    ? customerDisplayName(selectedCustomer, users)
    : '';
  const selectedEmail = selectedCustomer?.email ?? '—';
  const addresses = details?.addresses ?? [];
  const subscriptions = details?.subscriptions ?? [];
  const payments = details?.payments ?? [];
  const depositRequests = details?.depositRequests ?? [];
  const walletTransactions = details?.walletTransactions ?? [];
  const assignedBins = details?.bins ?? [];
  const tasks = details?.tasks ?? [];
  const complaints = details?.complaints ?? [];
  const wallet = details?.wallet ?? null;

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة عميل"
        description="أنشئ حساب عميل مع تحديد المدينة والمنطقة"
        onSubmit={submitCreate}
        submitLabel={COMMON.create}
        loading={saving}
      >
        <div className="form-grid">
          <Input
            label={COMMON.email}
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label={COMMON.name}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={COMMON.password}
            type="password"
            dir="ltr"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Select
            label={COMMON.city}
            value={form.cityId}
            onChange={(e) => handleCityChange(e.target.value)}
            required
            disabled={!cities.length}
          >
            <option value="">{COMMON.selectCity}</option>
            {cities.map((city) => (
              <option key={getId(city)} value={getId(city)}>
                {city.name}
              </option>
            ))}
          </Select>
          <Select
            label={COMMON.area}
            value={form.areaId}
            onChange={(e) => setForm({ ...form, areaId: e.target.value })}
            required
            disabled={!form.cityId}
          >
            <option value="">{COMMON.selectArea}</option>
            {formAreas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
        {!hasLocations ? (
          <p className="field__hint">أضف مدنًا ومناطق من صفحة المدن والمناطق قبل إنشاء عميل.</p>
        ) : null}
      </FormCard>

      <DataTable
        title="العملاء"
        description="إدارة العملاء والمحافظ والاشتراكات"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['customerName', 'email', 'cityName', 'areaName']}
        columns={[
          { key: 'customerName', label: COMMON.name },
          {
            key: 'email',
            label: COMMON.email,
            render: (row) => <span dir="ltr">{String(row.email ?? '—')}</span>,
          },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
        ]}
      />

      {selectedCustomer ? (
        <DetailPanel
          title={selectedName}
          subtitle={selectedEmail !== '—' ? selectedEmail : undefined}
          onClose={() => setSelected(null)}
        >
          {detailsLoading && !details ? (
            <p className="detail-block__muted">{COMMON.loading}</p>
          ) : (
            <div className="detail-stack">
              <section className="detail-block">
                <h4 className="detail-block__title">معلومات الحساب</h4>
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>{COMMON.name}</dt>
                    <dd>{selectedName}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.email}</dt>
                    <dd dir="ltr">{selectedEmail}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.status}</dt>
                    <dd>
                      <StatusBadge status={selectedCustomer.status ?? 'active'} />
                    </dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.city}</dt>
                    <dd>{cityNameById(cities, selectedCustomer.cityId)}</dd>
                  </div>
                  <div className="info-list__row">
                    <dt>{COMMON.area}</dt>
                    <dd>{areaNameById(areas, selectedCustomer.areaId)}</dd>
                  </div>
                </dl>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">المحفظة والإيداع</h4>
                <div className="wallet-card">
                  <span className="wallet-card__label">الرصيد الحالي</span>
                  <strong className="wallet-card__amount">
                    {formatMoney(wallet?.balance)}
                  </strong>
                </div>
                <form className="detail-form" onSubmit={submitDeposit}>
                  <Input
                    label="مبلغ الإيداع (إداري)"
                    type="number"
                    min={0.01}
                    step={0.01}
                    dir="ltr"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <Button type="submit" disabled={saving || detailsLoading || !depositAmount}>
                    إيداع في المحفظة
                  </Button>
                </form>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">
                  سجل المحفظة ({walletTransactions.length})
                </h4>
                <RecordList empty="لا توجد حركات على المحفظة.">
                  {walletTransactions.length > 0
                    ? walletTransactions.map((transaction: WalletTransaction) => (
                        <li key={getId(transaction)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>
                              {transaction.direction === 'debit' ? '−' : '+'}
                              {formatMoney(transaction.amount)}
                            </strong>
                            <StatusBadge
                              status={String(
                                WALLET_TRANSACTION_LABELS[transaction.type ?? ''] ??
                                  transaction.type,
                              )}
                            />
                          </div>
                          <div className="record-list__meta">
                            <span>{formatDateTime(transaction.createdAt)}</span>
                            <span>الرصيد بعد: {formatMoney(transaction.balanceAfter)}</span>
                          </div>
                          {transaction.description ? (
                            <p className="record-list__details">{transaction.description}</p>
                          ) : null}
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">
                  الاشتراكات ({subscriptions.length})
                </h4>
                <RecordList empty="لا توجد اشتراكات.">
                  {subscriptions.length > 0
                    ? subscriptions.map((subscription: Subscription) => (
                        <li key={getId(subscription)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>{planNameById(plans, subscription.planId)}</strong>
                            <StatusBadge status={String(subscription.status)} />
                          </div>
                          <div className="record-list__meta">
                            <span>الدفع: {subscription.paymentStatus ?? '—'}</span>
                            <span>الصندوق: {binCodeById(bins, subscription.binId)}</span>
                          </div>
                          <div className="record-list__meta">
                            <span>
                              {cityNameById(cities, subscription.cityId)} /{' '}
                              {areaNameById(areas, subscription.areaId)}
                            </span>
                            <span>
                              السائق: {driverNameById(drivers, users, subscription.driverId)}
                            </span>
                          </div>
                          <div className="record-list__meta">
                            <span>
                              مواعيد الجمع:{' '}
                              {subscription.collectionDates?.length
                                ? subscription.collectionDates.join('، ')
                                : '—'}
                            </span>
                          </div>
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">تعيين اشتراك جديد</h4>
                <form className="detail-form" onSubmit={submitAssignPlan}>
                  <Select
                    label="الخطة"
                    value={assignForm.planId}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        planId: e.target.value,
                        collectionDates: [],
                      })
                    }
                    required
                  >
                    <option value="">اختر الخطة</option>
                    {plans
                      .filter((plan) => plan.active !== false)
                      .map((plan) => (
                        <option key={getId(plan)} value={getId(plan)}>
                          {plan.name} — {plan.price} د.ل ({plan.numberOfCollections ?? 0} جمع)
                        </option>
                      ))}
                  </Select>
                  <Select
                    label="العنوان"
                    value={assignForm.addressId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, addressId: e.target.value })
                    }
                    required
                    disabled={addresses.length === 0}
                  >
                    <option value="">اختر العنوان</option>
                    {addresses.map((address: Address) => (
                      <option key={getId(address)} value={getId(address)}>
                        {address.label} — {addressLocationLabel(address, cities, areas)}
                        {address.isActive ? ' (نشط)' : ''}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="الصندوق"
                    value={assignForm.binId}
                    onChange={(e) => setAssignForm({ ...assignForm, binId: e.target.value })}
                  >
                    <option value="">بدون حاوية</option>
                    {availableBins.map((bin) => (
                      <option key={getId(bin)} value={getId(bin)}>
                        {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر
                        {bin.fee ? ` — ${bin.fee} د.ل` : ''})
                      </option>
                    ))}
                  </Select>
                  <div className="field">
                    <label className="field__label">
                      مواعيد الجمع
                      {requiredCollections
                        ? ` (${assignForm.collectionDates.length}/${requiredCollections})`
                        : ''}
                    </label>
                    <div className="form-grid" style={{ alignItems: 'end' }}>
                      <Input
                        label="تاريخ"
                        type="date"
                        dir="ltr"
                        value={collectionDateDraft}
                        onChange={(e) => setCollectionDateDraft(e.target.value)}
                        disabled={!assignForm.planId}
                      />
                      <Button
                        type="button"
                        disabled={
                          !collectionDateDraft ||
                          !assignForm.planId ||
                          (requiredCollections > 0 &&
                            assignForm.collectionDates.length >= requiredCollections)
                        }
                        onClick={addCollectionDate}
                      >
                        إضافة تاريخ
                      </Button>
                    </div>
                    {assignForm.collectionDates.length > 0 ? (
                      <ul className="record-list" style={{ marginTop: '0.75rem' }}>
                        {assignForm.collectionDates.map((date) => (
                          <li key={date} className="record-list__item">
                            <div className="record-list__header">
                              <strong dir="ltr">{date}</strong>
                              <Button type="button" onClick={() => removeCollectionDate(date)}>
                                حذف
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="field__hint">
                        اختر عدد أيام يساوي عدد جمعات الخطة ({requiredCollections || '—'}).
                      </p>
                    )}
                  </div>
                  {assignCost ? (
                    <p className="field__hint">
                      التكلفة: {formatMoney(assignCost.planPrice)} خطة
                      {assignCost.binFee > 0 ? ` + ${formatMoney(assignCost.binFee)} حاوية` : ''}
                      {' '}= {formatMoney(assignCost.total)}
                    </p>
                  ) : null}
                  <label className="inline-check detail-block__check">
                    <input
                      type="checkbox"
                      checked={assignForm.deductWallet}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, deductWallet: e.target.checked })
                      }
                    />
                    خصم التكلفة الإجمالية من المحفظة
                  </label>
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      detailsLoading ||
                      !assignForm.planId ||
                      !assignForm.addressId ||
                      !requiredCollections ||
                      assignForm.collectionDates.length !== requiredCollections
                    }
                  >
                    تعيين الاشتراك
                  </Button>
                </form>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">المدفوعات ({payments.length})</h4>
                <RecordList empty="لا توجد مدفوعات.">
                  {payments.length > 0
                    ? payments.map((payment: Payment) => (
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
                <h4 className="detail-block__title">
                  طلبات الإيداع ({depositRequests.length})
                </h4>
                <RecordList empty="لا توجد طلبات إيداع.">
                  {depositRequests.length > 0
                    ? depositRequests.map((request: DepositRequest) => (
                        <li key={getId(request)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>{formatMoney(request.amount)}</strong>
                            <StatusBadge status={String(request.status)} />
                          </div>
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">الصناديق ({assignedBins.length})</h4>
                <RecordList empty="لا توجد صناديق مرتبطة.">
                  {assignedBins.length > 0
                    ? assignedBins.map((bin: Bin) => (
                        <li key={getId(bin)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>{bin.code ?? getId(bin)}</strong>
                            <StatusBadge status={String(bin.status)} />
                          </div>
                          <div className="record-list__meta">
                            <span>السعة: {bin.capacity ?? 0} لتر</span>
                            <span>الرسوم: {formatMoney(bin.fee)}</span>
                            <span>{bin.active ? 'نشط' : 'غير نشط'}</span>
                          </div>
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">مهام الجمع ({tasks.length})</h4>
                <RecordList empty="لا توجد مهام.">
                  {tasks.length > 0
                    ? tasks.map((task: Task) => (
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
                <h4 className="detail-block__title">الشكاوى ({complaints.length})</h4>
                <RecordList empty="لا توجد شكاوى.">
                  {complaints.length > 0
                    ? complaints.map((complaint: Complaint) => (
                        <li key={getId(complaint)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>{complaint.subject ?? '—'}</strong>
                            <StatusBadge status={String(complaint.status)} />
                          </div>
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>

              <section className="detail-block">
                <h4 className="detail-block__title">العناوين ({addresses.length})</h4>
                <RecordList empty="لا توجد عناوين.">
                  {addresses.length > 0
                    ? addresses.map((address: Address) => (
                        <li key={getId(address)} className="record-list__item">
                          <div className="record-list__header">
                            <strong>{address.label}</strong>
                            {address.isActive ? <StatusBadge status="active" /> : null}
                          </div>
                          <div className="record-list__meta">
                            <span>{addressLocationLabel(address, cities, areas)}</span>
                          </div>
                          {address.details ? (
                            <p className="record-list__details">{address.details}</p>
                          ) : null}
                        </li>
                      ))
                    : null}
                </RecordList>
              </section>
            </div>
          )}
        </DetailPanel>
      ) : null}
    </div>
  );
}

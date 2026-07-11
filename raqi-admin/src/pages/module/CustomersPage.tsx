import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, CUSTOMER_TYPES } from '../../i18n/ar';
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
  Task,
  User,
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
    type: string;
    cityId: string;
    areaId: string;
  }) => Promise<void>;
  onUpdate: (id: string, body: { type: string }) => Promise<void>;
  onLoadDetails: (id: string) => Promise<CustomerDetails>;
  onDeposit: (id: string, amount: number) => Promise<void>;
  onAssignPlan: (body: {
    customerId: string;
    planId: string;
    binId: string;
    addressId: string;
    deductWallet?: boolean;
  }) => Promise<void>;
};

const emptyForm = {
  email: '',
  name: '',
  password: '',
  type: 'home',
  cityId: '',
  areaId: '',
};

function formatMoney(amount?: number) {
  return `${(amount ?? 0).toLocaleString('ar-LY')} د.ل`;
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
  onUpdate,
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
  });
  const [saving, setSaving] = useState(false);

  const formAreas = useMemo(() => areasForCity(areas, form.cityId), [areas, form.cityId]);
  const hasLocations = cities.length > 0 && areas.length > 0;
  const availableBins = useMemo(
    () => bins.filter((bin) => bin.status === 'available'),
    [bins],
  );

  const tableRows = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        customerName: customerDisplayName(customer, users),
        email: customer.email ?? '—',
        cityName: cityNameById(cities, customer.cityId),
        areaName: areaNameById(areas, customer.areaId),
        typeLabel: CUSTOMER_TYPES[customer.type ?? ''] ?? customer.type ?? '—',
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
    if (!selected) {
      setDetails(null);
      setAssignForm({ planId: '', binId: '', addressId: '', deductWallet: false });
      setDepositAmount('');
      return;
    }
    void reloadDetails(getId(selected));
  }, [onLoadDetails, selected?.id, selected?._id]);

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

  async function submitTypeUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), { type: selected.type ?? 'home' });
      await reloadDetails(getId(selected));
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
    if (!selected || !assignForm.planId || !assignForm.binId || !assignForm.addressId) return;
    setSaving(true);
    try {
      await onAssignPlan({
        customerId: getId(selected),
        planId: assignForm.planId,
        binId: assignForm.binId,
        addressId: assignForm.addressId,
        deductWallet: assignForm.deductWallet,
      });
      setAssignForm({ planId: '', binId: '', addressId: '', deductWallet: false });
      await reloadDetails(getId(selected));
    } finally {
      setSaving(false);
    }
  }

  const selectedCustomer = details?.customer ?? selected;
  const selectedName = selectedCustomer
    ? customerDisplayName(selectedCustomer, users)
    : '';
  const selectedEmail = selectedCustomer?.email ?? '—';
  const selectedTypeLabel = selectedCustomer
    ? CUSTOMER_TYPES[selectedCustomer.type ?? ''] ?? selectedCustomer.type ?? '—'
    : '—';
  const addresses = details?.addresses ?? [];
  const subscriptions = details?.subscriptions ?? [];
  const payments = details?.payments ?? [];
  const depositRequests = details?.depositRequests ?? [];
  const assignedBins = details?.bins ?? [];
  const tasks = details?.tasks ?? [];
  const complaints = details?.complaints ?? [];
  const wallet = details?.wallet ?? null;

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة عميل"
        description="أنشئ حساب عميل مع تحديد نوع النشاط والمدينة والمنطقة"
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
            label={COMMON.type}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          >
            {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
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
        searchKeys={['customerName', 'email', 'typeLabel', 'cityName', 'areaName']}
        columns={[
          { key: 'customerName', label: COMMON.name },
          {
            key: 'email',
            label: COMMON.email,
            render: (row) => <span dir="ltr">{String(row.email ?? '—')}</span>,
          },
          { key: 'typeLabel', label: COMMON.type },
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
                    <dt>{COMMON.type}</dt>
                    <dd>{selectedTypeLabel}</dd>
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
                <h4 className="detail-block__title">تعديل نوع النشاط</h4>
                <form className="detail-form" onSubmit={submitTypeUpdate}>
                  <Select
                    label={COMMON.type}
                    value={selectedCustomer.type ?? 'home'}
                    onChange={(e) =>
                      setSelected({ ...selectedCustomer, type: e.target.value })
                    }
                  >
                    {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : COMMON.save}
                  </Button>
                </form>
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
                    onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                    required
                  >
                    <option value="">اختر الخطة</option>
                    {plans
                      .filter((plan) => plan.active !== false)
                      .map((plan) => (
                        <option key={getId(plan)} value={getId(plan)}>
                          {plan.name} — {plan.price} د.ل
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
                    required
                  >
                    <option value="">اختر الصندوق</option>
                    {availableBins.map((bin) => (
                      <option key={getId(bin)} value={getId(bin)}>
                        {bin.code ?? getId(bin)} ({bin.capacity ?? 0} لتر)
                      </option>
                    ))}
                  </Select>
                  <label className="inline-check detail-block__check">
                    <input
                      type="checkbox"
                      checked={assignForm.deductWallet}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, deductWallet: e.target.checked })
                      }
                    />
                    خصم سعر الخطة من المحفظة
                  </label>
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      detailsLoading ||
                      !assignForm.planId ||
                      !assignForm.binId ||
                      !assignForm.addressId
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

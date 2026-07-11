import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, CUSTOMER_TYPES } from '../../i18n/ar';
import type { Address, Area, Bin, City, Customer, Plan, User, Wallet } from '../../types';
import {
  addressLocationLabel,
  areaNameById,
  areasForCity,
  cityNameById,
  getId,
  userNameById,
} from './shared';

type CustomersPageProps = {
  customers: Customer[];
  users: User[];
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
  onLoadDetails: (id: string) => Promise<{ wallet: Wallet | null; addresses: Address[] }>;
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

export function CustomersPage({
  customers,
  users,
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
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
        customerName: userNameById(users, customer.userId),
        cityName: cityNameById(cities, customer.cityId),
        areaName: areaNameById(areas, customer.areaId),
        typeLabel: CUSTOMER_TYPES[customer.type ?? ''] ?? customer.type ?? '—',
      })),
    [areas, cities, customers, users],
  );

  const reloadDetails = (customerId: string) => {
    setDetailsLoading(true);
    return onLoadDetails(customerId)
      .then((details) => {
        setWallet(details.wallet);
        setAddresses(details.addresses);
      })
      .finally(() => setDetailsLoading(false));
  };

  useEffect(() => {
    if (!selected) {
      setWallet(null);
      setAddresses([]);
      setAssignForm({ planId: '', binId: '', addressId: '', deductWallet: false });
      setDepositAmount('');
      return;
    }
    void reloadDetails(getId(selected));
  }, [onLoadDetails, selected]);

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

  const selectedSubtitle = selected
    ? `${userNameById(users, selected.userId)} · ${cityNameById(cities, selected.cityId)} / ${areaNameById(areas, selected.areaId)}`
    : undefined;

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
        searchKeys={['customerName', 'typeLabel', 'cityName', 'areaName']}
        columns={[
          { key: 'customerName', label: COMMON.name },
          { key: 'typeLabel', label: COMMON.type },
          { key: 'cityName', label: COMMON.city },
          { key: 'areaName', label: COMMON.area },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تفاصيل العميل"
          subtitle={selectedSubtitle}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">نوع النشاط</h4>
              <form className="form-grid" onSubmit={submitTypeUpdate}>
                <Select
                  label={COMMON.type}
                  value={selected.type ?? 'home'}
                  onChange={(e) => setSelected({ ...selected, type: e.target.value })}
                >
                  {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <div className="form-grid__actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : COMMON.save}
                  </Button>
                </div>
              </form>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">المحفظة</h4>
              {detailsLoading ? (
                <p className="detail-block__muted">{COMMON.loading}</p>
              ) : (
                <div className="wallet-card">
                  <span className="wallet-card__label">الرصيد الحالي</span>
                  <strong className="wallet-card__amount">
                    {(wallet?.balance ?? 0).toLocaleString('ar-LY')} د.ل
                  </strong>
                </div>
              )}
              <form className="form-grid detail-block__form" onSubmit={submitDeposit}>
                <Input
                  label="مبلغ الإيداع"
                  type="number"
                  min={0.01}
                  step={0.01}
                  dir="ltr"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <div className="form-grid__actions">
                  <Button type="submit" disabled={saving || detailsLoading || !depositAmount}>
                    إيداع في المحفظة
                  </Button>
                </div>
              </form>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">تعيين اشتراك</h4>
              <form className="form-grid" onSubmit={submitAssignPlan}>
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
                  onChange={(e) => setAssignForm({ ...assignForm, addressId: e.target.value })}
                  required
                  disabled={addresses.length === 0}
                >
                  <option value="">اختر العنوان</option>
                    {addresses.map((address) => (
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
                <div className="form-grid__actions">
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
                </div>
              </form>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">العناوين ({addresses.length})</h4>
              {detailsLoading ? (
                <p className="detail-block__muted">{COMMON.loading}</p>
              ) : addresses.length === 0 ? (
                <p className="detail-block__muted">لا توجد عناوين بعد.</p>
              ) : (
                <ul className="address-list">
                  {addresses.map((address) => (
                    <li key={getId(address)} className="address-list__item">
                      <div className="address-list__header">
                        <strong className="address-list__label">{address.label}</strong>
                        {address.isActive ? <StatusBadge status="active" /> : null}
                      </div>
                      <span className="address-list__area">
                        {addressLocationLabel(address, cities, areas)}
                      </span>
                      {address.details ? (
                        <p className="address-list__details">{address.details}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

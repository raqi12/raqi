import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminApi } from '../../api/modules';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type {
  Address,
  Area,
  Bin,
  City,
  Customer,
  Plan,
  Subscription,
  SubscriptionCost,
  User,
} from '../../types';
import {
  addressLocationLabel,
  customerDisplayName,
  getId,
} from './shared';
import { formatMoney } from './subscriptionUi';

type SubscriptionCreatePageProps = {
  plans: Plan[];
  bins: Bin[];
  customers: Customer[];
  users: User[];
  areas: Area[];
  cities: City[];
  onLoadAddresses: (customerId: string) => Promise<Address[]>;
  onCreate: (body: {
    customerId: string;
    planId?: string;
    addressId: string;
    binId?: string;
    paymentStatus?: 'paid' | 'unpaid';
  }) => Promise<Subscription | undefined>;
};

const emptyForm = {
  customerId: '',
  planId: '',
  addressId: '',
  binId: '',
  paymentStatus: 'unpaid' as 'paid' | 'unpaid',
};

export function SubscriptionCreatePage({
  plans,
  bins,
  customers,
  users,
  areas,
  cities,
  onLoadAddresses,
  onCreate,
}: SubscriptionCreatePageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formCost, setFormCost] = useState<SubscriptionCost | null>(null);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active !== false), [plans]);
  const availableBins = useMemo(
    () => bins.filter((bin) => (bin.availableCount ?? 0) > 0 && bin.active !== false),
    [bins],
  );

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
          addressId: items.some((address) => getId(address) === prev.addressId)
            ? prev.addressId
            : '',
        }));
      })
      .finally(() => setAddressesLoading(false));
  }, [form.customerId, onLoadAddresses]);

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

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.addressId || !form.planId) return;
    setSaving(true);
    try {
      const created = await onCreate({
        customerId: form.customerId,
        planId: form.planId,
        addressId: form.addressId,
        binId: form.binId || undefined,
        paymentStatus: form.paymentStatus,
      });
      if (created) {
        navigate(`/subscriptions/${getId(created)}`);
        return;
      }
      navigate('/subscriptions');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/subscriptions')}>
          ← العودة إلى الاشتراكات
        </Button>
        <h2 className="page-header__title">إنشاء اشتراك</h2>
        <p className="page-header__description">
          اربط العميل بالخطة والعنوان والصندوق، ثم أكمل التفعيل من صفحة التفاصيل
        </p>
      </header>

      <FormCard
        title="بيانات الاشتراك"
        description="اختر العميل والخطة والعنوان. الصندوق وحالة الدفع اختياريان عند الإنشاء"
        onSubmit={submitCreate}
        submitLabel="إنشاء الاشتراك"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">العميل والخطة</h3>
            <div className="form-grid">
              <Select
                label="العميل"
                value={form.customerId}
                onChange={(e) =>
                  setForm({
                    ...emptyForm,
                    customerId: e.target.value,
                    paymentStatus: 'unpaid',
                  })
                }
                required
              >
                <option value="">اختر العميل</option>
                {customers.map((customer) => (
                  <option key={getId(customer)} value={getId(customer)}>
                    {customerDisplayName(customer, users)}
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
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">العنوان والصندوق</h3>
            <div className="form-grid">
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
                    {bin.fee ? ` — ${bin.fee} د.ل` : ''} — {bin.availableCount ?? 0} متاح)
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
            {formCost ? (
              <p className="field__hint">
                التكلفة: {formatMoney(formCost.planPrice)} خطة
                {formCost.binFee > 0 ? ` + ${formatMoney(formCost.binFee)} حاوية` : ''}
                {' '}
                = {formatMoney(formCost.total)}
              </p>
            ) : null}
            {!customers.length ? (
              <p className="field__hint">أضف عملاء أولًا من صفحة العملاء.</p>
            ) : null}
            {form.customerId && !addressesLoading && !addresses.length ? (
              <p className="field__hint">
                لا توجد عناوين لهذا العميل. أضف عنوانًا من صفحة العملاء.
              </p>
            ) : null}
          </section>
        </div>
      </FormCard>
    </div>
  );
}

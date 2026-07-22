import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Address, Area, AdditionalCollectionSettings, BankAccountSettings, Bin, City, Customer, Driver, Payment, Plan, Subscription, Task, User, Wallet } from '../types';
import { areaLabel, customerDisplayName, getId } from './module/shared';

export { ManagersPage } from './module/ManagersPage';
export { ManagerCreatePage } from './module/ManagerCreatePage';
export { ManagerDetailPage } from './module/ManagerDetailPage';
export { CustomersPage } from './module/CustomersPage';
export { CustomerCreatePage } from './module/CustomerCreatePage';
export { CustomerDetailPage } from './module/CustomerDetailPage';
export { DriversPage } from './module/DriversPage';
export { DriverCreatePage } from './module/DriverCreatePage';
export { DriverDetailPage } from './module/DriverDetailPage';
export { SubscriptionsPage } from './module/SubscriptionsPage';
export { SubscriptionCreatePage } from './module/SubscriptionCreatePage';
export { SubscriptionDetailPage } from './module/SubscriptionDetailPage';
export { PlansPage } from './module/PlansPage';
export { PlanCreatePage } from './module/PlanCreatePage';
export { PlanDetailPage } from './module/PlanDetailPage';
export { BinsPage } from './module/BinsPage';
export { BinCreatePage } from './module/BinCreatePage';
export { BinDetailPage } from './module/BinDetailPage';
export { TasksPage } from './module/TasksPage';
export { TicketsPage } from './module/TicketsPage';
export { TicketChatPage } from './module/TicketChatPage';
export { ComplaintsPage } from './module/ComplaintsPage';
export { ComplaintDetailPage } from './module/ComplaintDetailPage';
export { SupportPage } from './module/SupportPage';
export { GalleryPage } from './module/GalleryPage';
export { GalleryCreatePage } from './module/GalleryCreatePage';
export { GalleryDetailPage } from './module/GalleryDetailPage';
export { ContentPageEditor } from './module/ContentPageEditor';
export { CashTopupsPage } from './module/CashTopupsPage';
export { DepositRequestsPage } from './module/DepositRequestsPage';

type PaymentsPageProps = {
  payments: Payment[];
  customers: Customer[];
  users: User[];
  subscriptions: Subscription[];
  onCreate: (body: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    method: 'cash' | 'online';
    description?: string;
  }) => Promise<void>;
  onConfirm: (id: string) => Promise<void>;
  onFail: (id: string) => Promise<void>;
};

export function PaymentsPage({
  payments,
  customers,
  users,
  subscriptions,
  onCreate,
  onConfirm,
  onFail,
}: PaymentsPageProps) {
  const [form, setForm] = useState({
    customerId: '',
    subscriptionId: '',
    amount: 0,
    method: 'cash' as 'cash' | 'online',
    description: '',
  });

  const customerSubscriptions = useMemo(
    () =>
      form.customerId
        ? subscriptions.filter((s) => s.customerId === form.customerId)
        : [],
    [subscriptions, form.customerId],
  );

  return (
    <>
      <section className="panel">
        <h2>تسجيل دفعة</h2>
        <p className="muted">
          عند التسجيل كـ مدفوعة يتم إيداع المبلغ في محفظة العميل وإنشاء حركة محفظة، مع تحديث حالة الاشتراك إن وُجد.
        </p>
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onCreate({
              customerId: form.customerId,
              subscriptionId: form.subscriptionId || undefined,
              amount: Number(form.amount),
              method: form.method,
              description: form.description || undefined,
            }).then(() =>
              setForm({
                customerId: '',
                subscriptionId: '',
                amount: 0,
                method: 'cash',
                description: '',
              }),
            );
          }}
        >
          <div className="row-form">
            <select
              required
              value={form.customerId}
              onChange={(e) =>
                setForm({ ...form, customerId: e.target.value, subscriptionId: '' })
              }
            >
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={getId(customer)} value={getId(customer)}>
                  {customerDisplayName(customer, users)}
                </option>
              ))}
            </select>
            <select
              value={form.subscriptionId}
              onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })}
              disabled={!form.customerId}
            >
              <option value="">بدون اشتراك</option>
              {customerSubscriptions.map((sub) => (
                <option key={getId(sub)} value={getId(sub)}>
                  {getId(sub).slice(-6)} · {sub.status} · {sub.paymentStatus}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              placeholder="المبلغ"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
            <select
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value as 'cash' | 'online' })
              }
            >
              <option value="cash">نقدي</option>
              <option value="online">إلكتروني</option>
            </select>
          </div>
          <input
            placeholder="وصف (اختياري)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit">تسجيل وإيداع في المحفظة</button>
        </form>
      </section>
      <DataTable
        title={`المدفوعات (${payments.length})`}
        rows={payments.map((p) => ({ ...p, id: getId(p) }))}
        columns={[
          { key: 'id', label: 'ID', render: (r) => getId(r).slice(-8) },
          {
            key: 'customerId',
            label: 'العميل',
            render: (r) => {
              const customer = customers.find((c) => getId(c) === r.customerId);
              return customer ? customerDisplayName(customer, users) : r.customerId ?? '—';
            },
          },
          { key: 'amount', label: 'المبلغ', render: (r) => String(r.amount ?? '-') },
          {
            key: 'method',
            label: 'الطريقة',
            render: (r) => (r.method === 'cash' ? 'نقدي' : 'إلكتروني'),
          },
          { key: 'status', label: 'الحالة' },
          {
            key: 'walletTransactionId',
            label: 'حركة المحفظة',
            render: (r) =>
              r.walletTransactionId ? String(r.walletTransactionId).slice(-8) : '—',
          },
          {
            key: 'actions',
            label: 'إجراءات',
            render: (r) => {
              const pending =
                r.status === 'pending' || r.status === 'pending_gateway';
              if (!pending) return '—';
              return (
                <div className="row-form">
                  <button type="button" onClick={() => void onConfirm(getId(r))}>
                    تأكيد
                  </button>
                  <button type="button" onClick={() => void onFail(getId(r))}>
                    فشل
                  </button>
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}

type BankAccountPageProps = {
  bankAccount: BankAccountSettings | null;
  onUpdate: (body: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    iban?: string;
    notes?: string;
    active?: boolean;
  }) => Promise<void>;
};

export function BankAccountPage({ bankAccount, onUpdate }: BankAccountPageProps) {
  const [form, setForm] = useState({
    bankName: bankAccount?.bankName ?? '',
    accountHolder: bankAccount?.accountHolder ?? '',
    accountNumber: bankAccount?.accountNumber ?? '',
    iban: bankAccount?.iban ?? '',
    notes: bankAccount?.notes ?? '',
    active: bankAccount?.active ?? true,
  });

  useEffect(() => {
    setForm({
      bankName: bankAccount?.bankName ?? '',
      accountHolder: bankAccount?.accountHolder ?? '',
      accountNumber: bankAccount?.accountNumber ?? '',
      iban: bankAccount?.iban ?? '',
      notes: bankAccount?.notes ?? '',
      active: bankAccount?.active ?? true,
    });
  }, [bankAccount]);

  return (
    <section className="panel">
      <h2>إعدادات الحساب البنكي</h2>
      <p className="muted">Customers use these details to transfer wallet deposits.</p>
      <form
        className="row-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onUpdate({
            bankName: form.bankName,
            accountHolder: form.accountHolder,
            accountNumber: form.accountNumber,
            iban: form.iban || undefined,
            notes: form.notes || undefined,
            active: form.active,
          });
        }}
      >
        <input placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
        <input placeholder="Account holder" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} />
        <input placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
        <input placeholder="IBAN (optional)" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
        <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <select value={form.active ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}

type AdditionalCollectionPageProps = {
  settings: AdditionalCollectionSettings | null;
  onUpdate: (body: { price: number; active?: boolean }) => Promise<void>;
};

export function AdditionalCollectionPage({
  settings,
  onUpdate,
}: AdditionalCollectionPageProps) {
  const [form, setForm] = useState({
    price: settings?.price != null ? String(settings.price) : '',
    active: settings?.active ?? true,
  });

  useEffect(() => {
    setForm({
      price: settings?.price != null ? String(settings.price) : '',
      active: settings?.active ?? true,
    });
  }, [settings]);

  return (
    <section className="panel">
      <h2>سعر الجمع الإضافي</h2>
      <p className="muted">
        سعر ثابت يُخصم من محفظة العميل عند طلب يوم جمع إضافي خلال فترة الاشتراك.
      </p>
      <form
        className="row-form"
        onSubmit={(e) => {
          e.preventDefault();
          const price = Number(form.price);
          if (Number.isNaN(price) || price < 0) return;
          void onUpdate({ price, active: form.active });
        }}
      >
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="السعر (د.ل)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <select
          value={form.active ? 'active' : 'inactive'}
          onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
        >
          <option value="active">مفعّل</option>
          <option value="inactive">متوقف</option>
        </select>
        <button type="submit">حفظ</button>
      </form>
    </section>
  );
}

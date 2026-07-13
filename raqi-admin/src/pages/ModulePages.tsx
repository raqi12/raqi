import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Address, Area, BankAccountSettings, Bin, City, Complaint, Customer, DepositRequest, Driver, Payment, Plan, Route, Subscription, Task, User, Wallet } from '../types';
import { API_ORIGIN, areaLabel, getId } from './module/shared';

export { UsersPage } from './module/UsersPage';
export { CustomersPage } from './module/CustomersPage';
export { SubscriptionsPage } from './module/SubscriptionsPage';
export { PlansPage } from './module/PlansPage';
export { BinsPage } from './module/BinsPage';
export { RoutesPage } from './module/RoutesPage';
export { TasksPage } from './module/TasksPage';
export { TicketsPage } from './module/TicketsPage';
export { SupportPage } from './module/SupportPage';

type PaymentsPageProps = {
  payments: Payment[];
  onCreate: (body: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    method: 'cash' | 'online';
  }) => Promise<void>;
};

export function PaymentsPage({ payments, onCreate }: PaymentsPageProps) {
  const [form, setForm] = useState({ customerId: '', subscriptionId: '', amount: 0, method: 'cash' as 'cash' | 'online' });
  return (
    <>
      <section className="panel">
        <h2>إنشاء دفعة</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onCreate({
            customerId: form.customerId,
            subscriptionId: form.subscriptionId || undefined,
            amount: Number(form.amount),
            method: form.method,
          });
        }}>
          <input placeholder="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <input placeholder="Subscription ID (optional)" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })} />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as 'cash' | 'online' })}>
            <option value="cash">cash</option>
            <option value="online">online</option>
          </select>
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`المدفوعات (${payments.length})`} rows={payments} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'amount', label: 'Amount', render: (r) => String(r.amount ?? '-') },
        { key: 'method', label: 'Method' },
        { key: 'status', label: 'Status' },
      ]} />
    </>
  );
}

type ComplaintsPageProps = {
  complaints: Complaint[];
  onUpdate: (
    id: string,
    body: { status?: 'open' | 'in_progress' | 'resolved' | 'closed'; assignee?: string },
  ) => Promise<void>;
};

export function ComplaintsPage({ complaints, onUpdate }: ComplaintsPageProps) {
  const [selected, setSelected] = useState<Complaint | null>(null);
  return (
    <>
      <DataTable title={`الشكاوى (${complaints.length})`} rows={complaints} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'assignee', label: 'Assignee' },
      ]} />
      {selected ? <section className="panel">
        <h3>Update Complaint</h3>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onUpdate(getId(selected), { status: selected.status, assignee: selected.assignee });
        }}>
          <select value={selected.status ?? 'open'} onChange={(e) => setSelected({ ...selected, status: e.target.value as Complaint['status'] })}>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>
          <input placeholder="Assignee" value={selected.assignee ?? ''} onChange={(e) => setSelected({ ...selected, assignee: e.target.value })} />
          <button>Save</button>
        </form>
      </section> : null}
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

type DepositRequestsPageProps = {
  depositRequests: DepositRequest[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, rejectionReason?: string) => Promise<void>;
};

export function DepositRequestsPage({ depositRequests, onApprove, onReject }: DepositRequestsPageProps) {
  const [selected, setSelected] = useState<DepositRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <>
      <DataTable
        title={`طلبات الإيداع (${depositRequests.length})`}
        rows={depositRequests}
        onSelect={setSelected}
        columns={[
          { key: 'id', label: 'ID', render: (r) => getId(r) },
          { key: 'customerId', label: 'Customer ID' },
          { key: 'amount', label: 'Amount', render: (r) => String(r.amount ?? '-') },
          { key: 'status', label: 'Status' },
        ]}
      />
      {selected ? (
        <section className="panel">
          <h3>Deposit Request: {getId(selected)}</h3>
          <p>Amount: <strong>{selected.amount}</strong></p>
          <p>Status: <strong>{selected.status}</strong></p>
          {selected.evidenceImageUrl ? (
            <p>
              Evidence:{' '}
              <a href={`${API_ORIGIN}${selected.evidenceImageUrl}`} target="_blank" rel="noreferrer">
                View transfer image
              </a>
            </p>
          ) : null}
          {selected.status === 'pending' ? (
            <div className="row-form">
              <input
                placeholder="Rejection reason (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <button type="button" onClick={() => void onApprove(getId(selected))}>Approve</button>
              <button
                type="button"
                className="ghost"
                onClick={() => void onReject(getId(selected), rejectionReason || undefined)}
              >
                Reject
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

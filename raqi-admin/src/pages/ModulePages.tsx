import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Address, Area, BankAccountSettings, Bin, Complaint, Customer, DepositRequest, Driver, Payment, Plan, Route, Subscription, Task, User, Wallet } from '../types';
import { API_ORIGIN, getId } from './module/shared';

export { UsersPage } from './module/UsersPage';

type CustomersPageProps = {
  customers: Customer[];
  plans: Plan[];
  bins: Bin[];
  onCreate: (body: { email: string; name: string; password: string; type: string }) => Promise<void>;
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

export function CustomersPage({
  customers,
  plans,
  bins,
  onCreate,
  onUpdate,
  onLoadDetails,
  onDeposit,
  onAssignPlan,
}: CustomersPageProps) {
  const [form, setForm] = useState({ email: '', name: '', password: '', type: 'home' });
  const [selected, setSelected] = useState<Customer | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [assignForm, setAssignForm] = useState({
    planId: '',
    binId: '',
    addressId: '',
    deductWallet: false,
  });

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
      return;
    }
    void reloadDetails(getId(selected));
  }, [onLoadDetails, selected]);

  const availableBins = useMemo(
    () => bins.filter((bin) => bin.status === 'available'),
    [bins],
  );

  return (
    <>
      <section className="panel">
        <h2>إنشاء عميل</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onCreate(form).then(() => setForm({ email: '', name: '', password: '', type: 'home' }));
        }}>
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="home">home</option>
            <option value="commercial">commercial</option>
            <option value="industrial">industrial</option>
          </select>
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`العملاء (${customers.length})`} rows={customers} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'userId', label: 'User ID' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
      ]} />
      {selected ? <section className="panel">
        <h3>Update Customer Type</h3>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onUpdate(getId(selected), { type: selected.type ?? 'home' });
        }}>
          <select value={selected.type ?? 'home'} onChange={(e) => setSelected({ ...selected, type: e.target.value })}>
            <option value="home">home</option>
            <option value="commercial">commercial</option>
            <option value="industrial">industrial</option>
          </select>
          <button>Save</button>
        </form>
        <h4>Wallet</h4>
        {detailsLoading ? <p className="muted">Loading wallet...</p> : (
          <p>Balance: <strong>{wallet?.balance ?? 0}</strong></p>
        )}
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          if (!selected || depositAmount <= 0) return;
          void onDeposit(getId(selected), depositAmount).then(() => {
            setDepositAmount(0);
            void reloadDetails(getId(selected));
          });
        }}>
          <input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Deposit amount"
            value={depositAmount || ''}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
          />
          <button type="submit">Deposit to wallet</button>
        </form>
        <h4>Assign Plan Subscription</h4>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          if (!selected) return;
          void onAssignPlan({
            customerId: getId(selected),
            planId: assignForm.planId,
            binId: assignForm.binId,
            addressId: assignForm.addressId,
            deductWallet: assignForm.deductWallet,
          }).then(() => {
            setAssignForm({ planId: '', binId: '', addressId: '', deductWallet: false });
            void reloadDetails(getId(selected));
          });
        }}>
          <select
            value={assignForm.planId}
            onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
          >
            <option value="">Select plan</option>
            {plans.filter((p) => p.active !== false).map((plan) => (
              <option key={getId(plan)} value={getId(plan)}>
                {plan.name} — {plan.price}
              </option>
            ))}
          </select>
          <select
            value={assignForm.addressId}
            onChange={(e) => setAssignForm({ ...assignForm, addressId: e.target.value })}
            disabled={addresses.length === 0}
          >
            <option value="">Select address</option>
            {addresses.map((address) => (
              <option key={getId(address)} value={getId(address)}>
                {address.label} — {address.area}
              </option>
            ))}
          </select>
          <select
            value={assignForm.binId}
            onChange={(e) => setAssignForm({ ...assignForm, binId: e.target.value })}
          >
            <option value="">Select bin</option>
            {availableBins.map((bin) => (
              <option key={getId(bin)} value={getId(bin)}>
                {bin.code ?? getId(bin)} ({bin.capacity ?? 0} capacity)
              </option>
            ))}
          </select>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={assignForm.deductWallet}
              onChange={(e) => setAssignForm({ ...assignForm, deductWallet: e.target.checked })}
            />
            Deduct plan price from wallet
          </label>
          <button type="submit">Assign subscription</button>
        </form>
        <h4>Addresses ({addresses.length})</h4>
        {detailsLoading ? <p className="muted">Loading addresses...</p> : addresses.length === 0 ? (
          <p className="muted">No addresses yet.</p>
        ) : (
          <ul>
            {addresses.map((address) => (
              <li key={getId(address)}>
                <strong>{address.label}</strong> — {address.area}: {address.details} (ID: {getId(address)})
              </li>
            ))}
          </ul>
        )}
      </section> : null}
    </>
  );
}

type DriversPageProps = {
  drivers: Driver[];
  onCreate: (body: { email: string; name: string; password: string; vehicleNumber: string }) => Promise<void>;
  onUpdate: (id: string, body: { vehicleNumber?: string }) => Promise<void>;
  onSetStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
};

export function DriversPage({ drivers, onCreate, onUpdate, onSetStatus }: DriversPageProps) {
  const [form, setForm] = useState({ email: '', name: '', password: '', vehicleNumber: '' });
  const [selected, setSelected] = useState<Driver | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: 'active' | 'inactive' } | null>(null);

  return (
    <>
      <section className="panel">
        <h2>إنشاء سائق</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onCreate(form).then(() => setForm({ email: '', name: '', password: '', vehicleNumber: '' }));
        }}>
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Vehicle Number" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`السائقون (${drivers.length})`} rows={drivers} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'userId', label: 'User ID' },
        { key: 'vehicleNumber', label: 'Vehicle' },
        { key: 'status', label: 'Status' },
      ]} />
      {selected ? <section className="panel">
        <h3>Edit Driver</h3>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onUpdate(getId(selected), { vehicleNumber: selected.vehicleNumber });
        }}>
          <input value={selected.vehicleNumber ?? ''} onChange={(e) => setSelected({ ...selected, vehicleNumber: e.target.value })} />
          <button>Save</button>
          <button type="button" className="ghost" onClick={() => setConfirm({ id: getId(selected), status: selected.status === 'active' ? 'inactive' : 'active' })}>
            Set {selected.status === 'active' ? 'Inactive' : 'Active'}
          </button>
        </form>
      </section> : null}
      <ConfirmDialog open={Boolean(confirm)} title="Change driver status" description="Confirm this driver status update." onCancel={() => setConfirm(null)} onConfirm={() => {
        if (!confirm) return;
        void onSetStatus(confirm.id, confirm.status);
        setConfirm(null);
      }} />
    </>
  );
}

type TasksPageProps = {
  tasks: Task[];
  areas: Area[];
  drivers: Driver[];
  onGenerate: (date: string, areaId: string) => Promise<void>;
  onAssign: (id: string, driverId: string) => Promise<void>;
};

export function TasksPage({ tasks, areas, drivers, onGenerate, onAssign }: TasksPageProps) {
  const [date, setDate] = useState('');
  const [areaId, setAreaId] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);
  const [driverId, setDriverId] = useState('');
  return (
    <>
      <section className="panel">
        <h2>توليد المهام</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onGenerate(date, areaId);
        }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Select area</option>
            {areas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name} — {area.city}
              </option>
            ))}
          </select>
          <button>Generate</button>
        </form>
      </section>
      <DataTable title={`المهام (${tasks.length})`} rows={tasks} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date', render: (r) => r.date?.slice(0, 10) ?? '-' },
        { key: 'driverId', label: 'Driver ID' },
      ]} />
      {selected ? <section className="panel">
        <h3>Assign Task</h3>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onAssign(getId(selected), driverId);
        }}>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={getId(driver)} value={getId(driver)}>
                {getId(driver)} — {driver.vehicleNumber ?? 'no vehicle'} ({driver.status})
              </option>
            ))}
          </select>
          <button>Assign</button>
        </form>
      </section> : null}
    </>
  );
}

type PlansPageProps = {
  plans: Plan[];
  onCreate: (body: {
    name: string;
    price: number;
    frequency: 'weekly' | 'monthly' | 'custom';
    durationDays: number;
    numberOfCollections: number;
    active?: boolean;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    body: {
      name?: string;
      price?: number;
      frequency?: 'weekly' | 'monthly' | 'custom';
      durationDays?: number;
      numberOfCollections?: number;
      active?: boolean;
    },
  ) => Promise<void>;
};

export function PlansPage({ plans, onCreate, onUpdate }: PlansPageProps) {
  const [form, setForm] = useState({
    name: '',
    price: 0,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'custom',
    durationDays: 30,
    numberOfCollections: 4,
    active: true,
  });
  const [selected, setSelected] = useState<Plan | null>(null);

  return (
    <>
      <section className="panel">
        <h2>إنشاء خطة</h2>
        <form
          className="row-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onCreate(form).then(() =>
              setForm({
                name: '',
                price: 0,
                frequency: 'monthly',
                durationDays: 30,
                numberOfCollections: 4,
                active: true,
              }),
            );
          }}
        >
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as 'weekly' | 'monthly' | 'custom' })}
          >
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="custom">custom</option>
          </select>
          <input
            type="number"
            placeholder="Duration (days)"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Collections"
            value={form.numberOfCollections}
            onChange={(e) => setForm({ ...form, numberOfCollections: Number(e.target.value) })}
          />
          <select
            value={form.active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button>Create</button>
        </form>
      </section>
      <DataTable
        title={`الخطط (${plans.length})`}
        rows={plans}
        onSelect={setSelected}
        columns={[
          { key: 'id', label: 'ID', render: (r) => getId(r) },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price', render: (r) => String(r.price ?? '-') },
          { key: 'frequency', label: 'Frequency' },
          { key: 'durationDays', label: 'Duration', render: (r) => String(r.durationDays ?? '-') },
          { key: 'numberOfCollections', label: 'Collections', render: (r) => String(r.numberOfCollections ?? '-') },
          { key: 'active', label: 'Active', render: (r) => (r.active ? 'yes' : 'no') },
        ]}
      />
      {selected ? (
        <section className="panel">
          <h3>Edit Plan: {getId(selected)}</h3>
          <form
            className="row-form"
            onSubmit={(e) => {
              e.preventDefault();
              void onUpdate(getId(selected), {
                name: selected.name,
                price: selected.price,
                frequency: selected.frequency,
                durationDays: selected.durationDays,
                numberOfCollections: selected.numberOfCollections,
                active: selected.active,
              });
            }}
          >
            <input value={selected.name ?? ''} onChange={(e) => setSelected({ ...selected, name: e.target.value })} />
            <input
              type="number"
              value={selected.price ?? 0}
              onChange={(e) => setSelected({ ...selected, price: Number(e.target.value) })}
            />
            <select
              value={selected.frequency ?? 'monthly'}
              onChange={(e) => setSelected({ ...selected, frequency: e.target.value as 'weekly' | 'monthly' | 'custom' })}
            >
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="custom">custom</option>
            </select>
            <input
              type="number"
              value={selected.durationDays ?? 0}
              onChange={(e) => setSelected({ ...selected, durationDays: Number(e.target.value) })}
            />
            <input
              type="number"
              value={selected.numberOfCollections ?? 0}
              onChange={(e) => setSelected({ ...selected, numberOfCollections: Number(e.target.value) })}
            />
            <select
              value={selected.active ? 'active' : 'inactive'}
              onChange={(e) => setSelected({ ...selected, active: e.target.value === 'active' })}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button>Save</button>
          </form>
        </section>
      ) : null}
    </>
  );
}

type SubscriptionsPageProps = {
  subscriptions: Subscription[];
  plans: Plan[];
  bins: Bin[];
  customers: Customer[];
  areas: Area[];
  onLoadAddresses: (customerId: string) => Promise<Address[]>;
  onCreate: (body: {
    customerId: string;
    planId?: string;
    addressId?: string;
    binId?: string;
    areaId?: string;
    paymentStatus?: 'paid' | 'unpaid';
  }) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onSuspend: (id: string) => Promise<void>;
  onRenew: (id: string) => Promise<void>;
};

export function SubscriptionsPage(props: SubscriptionsPageProps) {
  const [form, setForm] = useState({ customerId: '', planId: '', addressId: '', binId: '', areaId: '', paymentStatus: 'unpaid' as 'paid' | 'unpaid' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const actions = useMemo(() => selected ? [
    { label: 'Activate', onClick: () => props.onActivate(getId(selected)) },
    { label: 'Suspend', onClick: () => props.onSuspend(getId(selected)) },
    { label: 'Renew', onClick: () => props.onRenew(getId(selected)) },
  ] : [], [props, selected]);

  useEffect(() => {
    if (!form.customerId) {
      setAddresses([]);
      setForm((prev) => ({ ...prev, addressId: '' }));
      return;
    }
    void props.onLoadAddresses(form.customerId).then((items) => {
      setAddresses(items);
      setForm((prev) => ({
        ...prev,
        addressId: items.some((a) => getId(a) === prev.addressId) ? prev.addressId : '',
      }));
    });
  }, [form.customerId, props.onLoadAddresses]);

  return (
    <>
      <section className="panel">
        <h2>إنشاء اشتراك</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void props.onCreate({
            customerId: form.customerId,
            planId: form.planId || undefined,
            addressId: form.addressId || undefined,
            binId: form.binId || undefined,
            areaId: form.areaId || undefined,
            paymentStatus: form.paymentStatus,
          });
        }}>
          <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Select customer</option>
            {props.customers.map((customer) => (
              <option key={getId(customer)} value={getId(customer)}>
                {getId(customer)} — {customer.type} ({customer.status})
              </option>
            ))}
          </select>
          <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            <option value="">Select plan (optional)</option>
            {props.plans.map((plan) => (
              <option key={getId(plan)} value={getId(plan)}>
                {plan.name} — {plan.price} ({plan.numberOfCollections ?? '-'} collections)
              </option>
            ))}
          </select>
          <select value={form.addressId} onChange={(e) => setForm({ ...form, addressId: e.target.value })} disabled={!form.customerId}>
            <option value="">Select address (optional)</option>
            {addresses.map((address) => (
              <option key={getId(address)} value={getId(address)}>
                {address.label} — {address.area}
              </option>
            ))}
          </select>
          <select value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })}>
            <option value="">Select bin (optional)</option>
            {props.bins.map((bin) => (
              <option key={getId(bin)} value={getId(bin)}>
                {bin.code ?? getId(bin)} — {bin.status} ({bin.capacity ?? 0} capacity)
              </option>
            ))}
          </select>
          <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
            <option value="">Select area (optional)</option>
            {props.areas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name} — {area.city}
              </option>
            ))}
          </select>
          <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as 'paid' | 'unpaid' })}>
            <option value="unpaid">unpaid</option>
            <option value="paid">paid</option>
          </select>
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`الاشتراكات (${props.subscriptions.length})`} rows={props.subscriptions} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'planId', label: 'Plan ID' },
        { key: 'binId', label: 'Bin ID' },
        { key: 'status', label: 'Status' },
        { key: 'paymentStatus', label: 'Payment' },
      ]} />
      {selected ? <section className="panel">
        <h3>Subscription Actions</h3>
        <div className="actions">
          {actions.map((action) => (
            <button key={action.label} onClick={() => void action.onClick()}>{action.label}</button>
          ))}
        </div>
      </section> : null}
    </>
  );
}

type BinsPageProps = {
  bins: Bin[];
  customers: Customer[];
  onCreate: (body: { code: string; qr: string; capacity?: number }) => Promise<void>;
  onUpdate: (id: string, body: { capacity?: number; status?: 'available' | 'assigned' | 'maintenance' }) => Promise<void>;
  onAssign: (id: string, customerId: string) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
};

export function BinsPage({ bins, customers, onCreate, onUpdate, onAssign, onUnassign }: BinsPageProps) {
  const [form, setForm] = useState({ code: '', qr: '', capacity: 0 });
  const [selected, setSelected] = useState<Bin | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');

  return (
    <>
      <section className="panel">
        <h2>إنشاء صندوق</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onCreate({
            code: form.code,
            qr: form.qr,
            capacity: form.capacity || undefined,
          }).then(() => setForm({ code: '', qr: '', capacity: 0 }));
        }}>
          <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input placeholder="QR" value={form.qr} onChange={(e) => setForm({ ...form, qr: e.target.value })} />
          <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`الصناديق (${bins.length})`} rows={bins} onSelect={setSelected} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'code', label: 'Code' },
        { key: 'capacity', label: 'Capacity', render: (r) => String(r.capacity ?? '-') },
        { key: 'status', label: 'Status' },
        { key: 'customerId', label: 'Customer ID', render: (r) => r.customerId ?? '-' },
        { key: 'active', label: 'Active', render: (r) => String(r.active ?? false) },
      ]} />
      {selected ? (
        <section className="panel">
          <h3>Edit Bin: {selected.code ?? getId(selected)}</h3>
          <form className="row-form" onSubmit={(e) => {
            e.preventDefault();
            void onUpdate(getId(selected), {
              capacity: selected.capacity,
              status: selected.status,
            });
          }}>
            <input
              type="number"
              value={selected.capacity ?? 0}
              onChange={(e) => setSelected({ ...selected, capacity: Number(e.target.value) })}
            />
            <select
              value={selected.status ?? 'available'}
              onChange={(e) => setSelected({ ...selected, status: e.target.value as Bin['status'] })}
            >
              <option value="available">available</option>
              <option value="assigned">assigned</option>
              <option value="maintenance">maintenance</option>
            </select>
            <button>Save</button>
          </form>
          <h4>Assign to Customer</h4>
          <form className="row-form" onSubmit={(e) => {
            e.preventDefault();
            void onAssign(getId(selected), assignCustomerId);
          }}>
            <select value={assignCustomerId} onChange={(e) => setAssignCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={getId(customer)} value={getId(customer)}>
                  {getId(customer)} — {customer.type}
                </option>
              ))}
            </select>
            <button type="submit">Assign</button>
            <button type="button" className="ghost" onClick={() => void onUnassign(getId(selected))}>
              Unassign
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}

type AreasPageProps = {
  areas: Area[];
  onCreate: (body: { name: string; city: string }) => Promise<void>;
};

export function AreasPage({ areas, onCreate }: AreasPageProps) {
  const [form, setForm] = useState({ name: '', city: '' });
  return (
    <>
      <section className="panel">
        <h2>إنشاء منطقة</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          void onCreate(form).then(() => setForm({ name: '', city: '' }));
        }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`المناطق (${areas.length})`} rows={areas} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'City' },
      ]} />
    </>
  );
}

type RoutesPageProps = {
  routes: Route[];
  areas: Area[];
  onCreate: (body: { name: string; areaId: string; stops?: string[] }) => Promise<void>;
};

export function RoutesPage({ routes, areas, onCreate }: RoutesPageProps) {
  const [form, setForm] = useState({ name: '', areaId: '', stops: '' });
  return (
    <>
      <section className="panel">
        <h2>إنشاء مسار</h2>
        <form className="row-form" onSubmit={(e) => {
          e.preventDefault();
          const stops = form.stops
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          void onCreate({
            name: form.name,
            areaId: form.areaId,
            stops: stops.length ? stops : undefined,
          }).then(() => setForm({ name: '', areaId: '', stops: '' }));
        }}>
          <input placeholder="Route name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
            <option value="">Select area</option>
            {areas.map((area) => (
              <option key={getId(area)} value={getId(area)}>
                {area.name} — {area.city}
              </option>
            ))}
          </select>
          <input placeholder="Stops (comma-separated)" value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} />
          <button>Create</button>
        </form>
      </section>
      <DataTable title={`المسارات (${routes.length})`} rows={routes} columns={[
        { key: 'id', label: 'ID', render: (r) => getId(r) },
        { key: 'name', label: 'Name' },
        { key: 'areaId', label: 'Area ID' },
        { key: 'stops', label: 'Stops', render: (r) => (r.stops ?? []).join(', ') || '-' },
      ]} />
    </>
  );
}

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

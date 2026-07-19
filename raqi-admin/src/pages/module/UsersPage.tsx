import { FormEvent, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON, ROLES } from '../../i18n/ar';
import type { User } from '../../types';
import { getId } from './shared';

type UsersPageProps = {
  users: User[];
  loading?: boolean;
  onCreate: (body: { email: string; name: string; password: string; role: string }) => Promise<void>;
  onUpdate: (id: string, body: { email?: string; name?: string }) => Promise<void>;
  onSetStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
};

export function UsersPage({ users, onCreate, onUpdate, onSetStatus, loading = false }: UsersPageProps) {
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'support' });
  const [selected, setSelected] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: 'active' | 'inactive' } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreate(form);
      setForm({ email: '', name: '', password: '', role: 'support' });
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), { email: selected.email, name: selected.name });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <FormCard
        title="إضافة مستخدم"
        description="أنشئ حسابًا جديدًا مع تحديد الدور والصلاحيات"
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
            label={COMMON.role}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {Object.entries(ROLES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </FormCard>

      <DataTable
        title="المستخدمون"
        description="إدارة حسابات الفريق والصلاحيات"
        rows={users}
        loading={loading}
        onSelect={setSelected}
        searchKeys={['email', 'name', 'phone', 'role', 'status']}
        columns={[
          { key: 'name', label: COMMON.name },
          { key: 'email', label: COMMON.email },
          {
            key: 'phone',
            label: COMMON.phone,
            render: (r) => (
              <span dir="ltr">{r.phone ? String(r.phone) : '—'}</span>
            ),
          },
          {
            key: 'role',
            label: COMMON.role,
            render: (r) => ROLES[String(r.role)] ?? String(r.role ?? '—'),
          },
          {
            key: 'status',
            label: COMMON.status,
            render: (r) => <StatusBadge status={String(r.status)} />,
            sortable: false,
          },
        ]}
      />

      {selected ? (
        <DetailPanel
          title="تعديل المستخدم"
          subtitle={selected.email}
          onClose={() => setSelected(null)}
          footer={
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setConfirm({
                  id: getId(selected),
                  status: selected.status === 'active' ? 'inactive' : 'active',
                })
              }
            >
              {selected.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </Button>
          }
        >
          <form className="form-grid" onSubmit={submitUpdate}>
            <Input
              label={COMMON.email}
              dir="ltr"
              value={selected.email ?? ''}
              onChange={(e) => setSelected({ ...selected, email: e.target.value })}
            />
            <Input
              label={COMMON.name}
              value={selected.name ?? ''}
              onChange={(e) => setSelected({ ...selected, name: e.target.value })}
            />
            <div className="form-grid__actions">
              <Button type="submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : COMMON.save}
              </Button>
            </div>
          </form>
        </DetailPanel>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="تغيير حالة المستخدم"
        description="هل تريد تأكيد تحديث حالة هذا الحساب؟"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          void onSetStatus(confirm.id, confirm.status);
          setConfirm(null);
        }}
      />
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { User } from '../../types';
import { getId } from './shared';
import {
  DASHBOARD_PERMISSIONS,
  STAFF_ROLES,
} from './dashboardPermissions';

type ManagerDetailPageProps = {
  users: User[];
  currentRole?: string;
  onUpdate: (
    id: string,
    body: {
      email?: string;
      name?: string;
      role?: string;
      permissions?: string[];
    },
  ) => Promise<void>;
  onSetStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
};

export function ManagerDetailPage({
  users,
  currentRole = 'admin',
  onUpdate,
  onSetStatus,
}: ManagerDetailPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => users.find((item) => getId(item) === id) ?? null, [id, users]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'supervisor',
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'active' | 'inactive' | null>(null);

  const canEditRole = currentRole === 'admin';

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'supervisor',
    });
    setPermissions(user.permissions ?? []);
  }, [user]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, typeof DASHBOARD_PERMISSIONS>();
    for (const item of DASHBOARD_PERMISSIONS) {
      if (item.id === 'managers' && form.role === 'supervisor') continue;
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, [form.role]);

  function togglePermission(pageId: string) {
    setPermissions((prev) =>
      prev.includes(pageId) ? prev.filter((item) => item !== pageId) : [...prev, pageId],
    );
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await onUpdate(getId(user), {
        name: form.name.trim(),
        email: form.email.trim(),
        ...(canEditRole ? { role: form.role } : {}),
        permissions: form.role === 'admin' ? [] : permissions,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/managers')}>
          ← العودة إلى المدراء
        </Button>
        <div className="customer-empty">
          <h2>الحساب غير موجود</h2>
          <p>تعذر العثور على هذا الحساب أو تم حذفه.</p>
          <Button type="button" onClick={() => navigate('/managers')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page customer-detail-page">
      <header className="customer-detail-hero">
        <div className="customer-detail-hero__top">
          <Button type="button" variant="ghost" onClick={() => navigate('/managers')}>
            ← العودة إلى المدراء
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setConfirm(user.status === 'active' ? 'inactive' : 'active')
            }
          >
            {user.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
          </Button>
        </div>
        <div className="customer-detail-hero__body">
          <div>
            <p className="customer-detail-hero__eyebrow">تفاصيل الحساب</p>
            <h2 className="customer-detail-hero__title">{user.name || '—'}</h2>
            <div className="customer-detail-hero__meta">
              <span dir="ltr">{user.email ?? '—'}</span>
              <span>{STAFF_ROLES[String(user.role)] ?? user.role}</span>
              <StatusBadge status={user.status ?? 'active'} />
            </div>
          </div>
        </div>
      </header>

      <FormCard
        title="تعديل الحساب والصلاحيات"
        description="كل صلاحية تمنح الوصول لصفحة واحدةفي لوحة التحكم"
        onSubmit={submitUpdate}
        submitLabel="حفظ التغييرات"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">البيانات الأساسية</h3>
            <div className="form-grid">
              <Input
                label={COMMON.name}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label={COMMON.email}
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              {canEditRole ? (
                <Select
                  label={COMMON.role}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={user.role === 'admin'}
                >
                  {Object.entries(STAFF_ROLES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  label={COMMON.role}
                  value={STAFF_ROLES[form.role] ?? form.role}
                  disabled
                />
              )}
            </div>
          </section>

          {form.role === 'admin' ? (
            <section className="customer-form-section">
              <h3 className="customer-form-section__title">الصلاحيات</h3>
              <p className="field__hint">مدير النظام لديه صلاحية كل صفحات اللوحة تلقائياً.</p>
            </section>
          ) : (
            <section className="customer-form-section">
              <h3 className="customer-form-section__title">صلاحيات الصفحات</h3>
              <p className="field__hint">
                المشرف يدير فقط الصفحات المحددة أدناه. المدير يمكنه أيضاً إدارة حسابات المشرفين.
              </p>
              <div className="permission-groups">
                {groupedPermissions.map(([group, items]) => (
                  <div key={group} className="permission-group">
                    <h4 className="permission-group__title">{group}</h4>
                    <div className="permission-group__list">
                      {items.map((item) => (
                        <label key={item.id} className="permission-check">
                          <input
                            type="checkbox"
                            checked={permissions.includes(item.id)}
                            onChange={() => togglePermission(item.id)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </FormCard>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="تغيير حالة الحساب"
        description="هل تريد تأكيد تحديث حالة هذا الحساب؟"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          void onSetStatus(getId(user), confirm).then(() => setConfirm(null));
        }}
      />
    </div>
  );
}

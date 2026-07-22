import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCard } from '../../components/forms/FormCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { COMMON } from '../../i18n/ar';
import type { User } from '../../types';
import { getId } from './shared';
import {
  DASHBOARD_PERMISSIONS,
  STAFF_ROLES,
} from './dashboardPermissions';

type ManagerCreatePageProps = {
  currentRole?: string;
  onCreate: (body: {
    email: string;
    name: string;
    password: string;
    role: string;
    permissions: string[];
  }) => Promise<User | undefined>;
};

export function ManagerCreatePage({
  currentRole = 'admin',
  onCreate,
}: ManagerCreatePageProps) {
  const navigate = useNavigate();
  const canCreateManager = currentRole === 'admin';
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: canCreateManager ? 'supervisor' : 'supervisor',
  });
  const [permissions, setPermissions] = useState<string[]>(['overview']);
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(() => {
    if (canCreateManager) {
      return Object.entries(STAFF_ROLES).filter(([value]) => value !== 'admin');
    }
    return Object.entries(STAFF_ROLES).filter(([value]) => value === 'supervisor');
  }, [canCreateManager]);

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

  function togglePermission(id: string) {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await onCreate({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        role: form.role,
        permissions,
      });
      if (created) {
        navigate(`/managers/${getId(created)}`);
        return;
      }
      navigate('/managers');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page customer-form-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate('/managers')}>
          ← العودة إلى المدراء
        </Button>
        <h2 className="page-header__title">إضافة حساب</h2>
        <p className="page-header__description">
          أنشئ مديراً أو مشرفاً وحدد صفحات لوحة التحكم التي يمكنه إدارتها
        </p>
      </header>

      <FormCard
        title="بيانات الحساب"
        description="كل صلاحية تقابل صفحة واحدةفي لوحة التحكم"
        onSubmit={submitCreate}
        submitLabel="إنشاء الحساب"
        loading={saving}
      >
        <div className="customer-form-sections">
          <section className="customer-form-section">
            <h3 className="customer-form-section__title">معلومات الدخول</h3>
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
              <Input
                label={COMMON.password}
                type="password"
                dir="ltr"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              <Select
                label={COMMON.role}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="customer-form-section">
            <h3 className="customer-form-section__title">صلاحيات الصفحات</h3>
            <p className="field__hint">
              اختر الصفحات التي يستطيع هذا الحساب فتحها وإدارتها في لوحة التحكم.
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
        </div>
      </FormCard>
    </div>
  );
}

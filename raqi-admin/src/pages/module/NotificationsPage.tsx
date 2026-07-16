import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AdminApi } from '../../api/modules';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KpiStat } from '../../components/ui/KpiStat';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type {
  AppNotification,
  NotificationAnalytics,
  NotificationLog,
  NotificationPreference,
  NotificationTemplate,
  ScheduledNotification,
  SendNotificationBody,
  User,
} from '../../types';
import { getId } from './shared';

const SUB_NAV: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/notifications', label: 'القائمة', end: true },
  { to: '/notifications/send', label: 'إرسال' },
  { to: '/notifications/scheduled', label: 'المجدولة' },
  { to: '/notifications/templates', label: 'القوالب' },
  { to: '/notifications/analytics', label: 'التحليلات' },
  { to: '/notifications/settings', label: 'الإعدادات' },
];

const TYPE_OPTIONS = [
  'system',
  'announcement',
  'ticket',
  'task',
  'subscription',
  'payment',
  'user',
  'message',
  'custom',
];

const CATEGORY_OPTIONS = [
  'general',
  'operations',
  'billing',
  'support',
  'security',
  'marketing',
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

function NotificationsSubNav() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, '');
  return (
    <nav className="notif-subnav" aria-label="أقسام الإشعارات">
      {SUB_NAV.map((item) => {
        const active = item.end
          ? path === item.to
          : path === item.to || path.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={['notif-subnav__link', active ? 'notif-subnav__link--active' : '']
              .filter(Boolean)
              .join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ListView({ onToast }: { onToast: (message: string) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [isRead, setIsRead] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminApi.notifications.list({
        page,
        limit: 20,
        search: search || undefined,
        type: type || undefined,
        category: category || undefined,
        isRead: isRead === '' ? undefined : isRead === 'true',
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'تعذر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [page, search, type, category, isRead, onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        id: getId(item),
        readLabel: item.isRead ? 'مقروء' : 'غير مقروء',
        createdLabel: formatDateTime(item.createdAt),
      })),
    [items],
  );

  return (
    <>
      <section className="panel">
        <div className="row-form">
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <Select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
            <option value="">كل الأنواع</option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
            <option value="">كل الفئات</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          <Select value={isRead} onChange={(e) => { setPage(1); setIsRead(e.target.value); }}>
            <option value="">الكل</option>
            <option value="false">غير مقروء</option>
            <option value="true">مقروء</option>
          </Select>
          <Button type="button" variant="ghost" onClick={() => void load()} disabled={loading}>
            {COMMON.refresh}
          </Button>
          {selectedIds.length > 0 ? (
            <Button type="button" onClick={() => setConfirmBulk(true)}>
              حذف المحدد ({selectedIds.length})
            </Button>
          ) : null}
        </div>
      </section>

      <DataTable
        title={`الإشعارات (${total})`}
        rows={rows}
        loading={loading}
        onSelect={(row) => navigate(`/notifications/${getId(row)}`)}
        columns={[
          {
            key: 'select',
            label: '',
            render: (row) => (
              <input
                type="checkbox"
                checked={selectedIds.includes(getId(row))}
                onChange={(e) => {
                  e.stopPropagation();
                  const id = getId(row);
                  setSelectedIds((prev) =>
                    e.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
                  );
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ),
          },
          { key: 'title', label: 'العنوان' },
          { key: 'type', label: 'النوع' },
          { key: 'category', label: 'الفئة' },
          {
            key: 'readLabel',
            label: 'الحالة',
            render: (row) => (
              <StatusBadge status={row.isRead ? 'resolved' : 'pending'} />
            ),
          },
          { key: 'createdLabel', label: 'التاريخ' },
        ]}
      />

      <div className="row-form" style={{ justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          السابق
        </Button>
        <span>صفحة {page}</span>
        <Button
          type="button"
          variant="ghost"
          disabled={items.length === 0 || page * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          التالي
        </Button>
      </div>

      <ConfirmDialog
        open={confirmBulk}
        title="حذف الإشعارات"
        description={`حذف ${selectedIds.length} إشعار؟`}
        onCancel={() => setConfirmBulk(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await AdminApi.notifications.bulkDelete(selectedIds);
              setSelectedIds([]);
              setConfirmBulk(false);
              onToast('تم الحذف');
              await load();
            } catch (error) {
              onToast(error instanceof Error ? error.message : 'تعذر الحذف');
            }
          })();
        }}
      />
    </>
  );
}

function DetailView({ onToast }: { onToast: (message: string) => void }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await AdminApi.notifications.get(id);
        if (cancelled) return;
        setNotification(res.data.notification);
        setLogs(res.data.logs);
      } catch (error) {
        onToast(error instanceof Error ? error.message : 'تعذر التحميل');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, onToast]);

  if (loading) return <p>{COMMON.loading}</p>;
  if (!notification) return <p>الإشعار غير موجود</p>;

  return (
    <DetailPanel
      title={notification.title ?? 'تفاصيل الإشعار'}
      onClose={() => navigate('/notifications')}
    >
      <dl className="detail-grid">
        <div><dt>العنوان</dt><dd>{notification.title}</dd></div>
        <div><dt>النص</dt><dd>{notification.body}</dd></div>
        <div><dt>النوع</dt><dd>{notification.type ?? '—'}</dd></div>
        <div><dt>الفئة</dt><dd>{notification.category ?? '—'}</dd></div>
        <div><dt>الأولوية</dt><dd>{notification.priority ?? '—'}</dd></div>
        <div><dt>المستخدم</dt><dd>{notification.userId ?? '—'}</dd></div>
        <div><dt>مقروء</dt><dd>{notification.isRead ? 'نعم' : 'لا'}</dd></div>
        <div><dt>رابط الإجراء</dt><dd>{notification.actionUrl ?? '—'}</dd></div>
        <div><dt>المرجع</dt><dd>{notification.referenceType ?? '—'} / {notification.referenceId ?? '—'}</dd></div>
        <div><dt>أُنشئ</dt><dd>{formatDateTime(notification.createdAt)}</dd></div>
      </dl>

      <h3>سجلات التسليم</h3>
      <DataTable
        title={`السجلات (${logs.length})`}
        rows={logs.map((log) => ({ ...log, id: getId(log) }))}
        columns={[
          { key: 'channel', label: 'القناة' },
          { key: 'status', label: 'الحالة' },
          { key: 'errorMessage', label: 'خطأ', render: (r) => r.errorMessage ?? '—' },
          {
            key: 'deliveredAt',
            label: 'التسليم',
            render: (r) => formatDateTime(r.deliveredAt),
          },
        ]}
      />

      <Button
        type="button"
        onClick={() => {
          void (async () => {
            try {
              await AdminApi.notifications.remove(id);
              onToast('تم الحذف');
              navigate('/notifications');
            } catch (error) {
              onToast(error instanceof Error ? error.message : 'تعذر الحذف');
            }
          })();
        }}
      >
        {COMMON.delete}
      </Button>
    </DetailPanel>
  );
}

function ComposerForm({
  users,
  onSubmit,
  submitLabel,
  initialScheduledAt,
}: {
  users: User[];
  onSubmit: (body: SendNotificationBody & { scheduledAt?: string }) => Promise<void>;
  submitLabel: string;
  initialScheduledAt?: boolean;
}) {
  type TargetMode =
    | 'all'
    | 'dashboard'
    | 'drivers'
    | 'customers'
    | 'both'
    | 'one'
    | 'some';

  const TARGET_OPTIONS: Array<{
    id: TargetMode;
    label: string;
    hint: string;
  }> = [
    { id: 'all', label: 'الجميع', hint: 'كل المستخدمين النشطين' },
    { id: 'dashboard', label: 'لوحة التحكم', hint: 'مدراء النظام فقط' },
    { id: 'drivers', label: 'السائقون', hint: 'كل السائقين' },
    { id: 'customers', label: 'العملاء', hint: 'كل العملاء' },
    { id: 'both', label: 'سائقون وعملاء', hint: 'بدون المدراء' },
    { id: 'one', label: 'مستخدم واحد', hint: 'اختر شخصاً' },
    { id: 'some', label: 'مستخدمون محددون', hint: 'اختيار متعدد' },
  ];

  const [form, setForm] = useState({
    title: '',
    body: '',
    image: '',
    type: 'announcement',
    category: 'general',
    priority: 'medium',
    targetMode: 'all' as TargetMode,
    userId: '',
    selectedIds: [] as string[],
    userFilter: '',
    filterRole: 'all',
    actionUrl: '',
    referenceType: '',
    referenceId: '',
    scheduledAt: '',
  });
  const [saving, setSaving] = useState(false);

  const activeUsers = useMemo(
    () => users.filter((user) => (user.status ?? 'active') === 'active'),
    [users],
  );

  const selectableUsers = useMemo(() => {
    const q = form.userFilter.trim().toLowerCase();
    return activeUsers.filter((user) => {
      if (form.filterRole !== 'all' && user.role !== form.filterRole) return false;
      if (!q) return true;
      const hay = `${user.name ?? ''} ${user.email ?? ''} ${user.role ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeUsers, form.userFilter, form.filterRole]);

  const estimatedCount = useMemo(() => {
    switch (form.targetMode) {
      case 'all':
        return activeUsers.length;
      case 'dashboard':
        return activeUsers.filter((u) => u.role === 'admin').length;
      case 'drivers':
        return activeUsers.filter((u) => u.role === 'driver').length;
      case 'customers':
        return activeUsers.filter((u) => u.role === 'customer').length;
      case 'both':
        return activeUsers.filter((u) => u.role === 'driver' || u.role === 'customer').length;
      case 'one':
        return form.userId ? 1 : 0;
      case 'some':
        return form.selectedIds.length;
      default:
        return 0;
    }
  }, [activeUsers, form.targetMode, form.userId, form.selectedIds]);

  const buildPayload = (): SendNotificationBody => {
    const base: SendNotificationBody = {
      title: form.title,
      body: form.body,
      image: form.image || undefined,
      type: form.type,
      category: form.category,
      priority: form.priority,
      actionUrl: form.actionUrl || undefined,
      referenceType: form.referenceType || undefined,
      referenceId: form.referenceId || undefined,
    };

    switch (form.targetMode) {
      case 'all':
        return { ...base, audience: 'all' };
      case 'dashboard':
        return { ...base, audience: 'roles', roles: ['admin'] };
      case 'drivers':
        return { ...base, audience: 'roles', roles: ['driver'] };
      case 'customers':
        return { ...base, audience: 'roles', roles: ['customer'] };
      case 'both':
        return { ...base, audience: 'roles', roles: ['driver', 'customer'] };
      case 'one':
        return { ...base, audience: 'user', userId: form.userId };
      case 'some':
        return { ...base, audience: 'users', userIds: form.selectedIds };
      default:
        return { ...base, audience: 'all' };
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.targetMode === 'one' && !form.userId) return;
    if (form.targetMode === 'some' && form.selectedIds.length === 0) return;

    void (async () => {
      setSaving(true);
      try {
        await onSubmit({
          ...buildPayload(),
          scheduledAt: initialScheduledAt ? form.scheduledAt : undefined,
        });
        setForm((prev) => ({
          ...prev,
          title: '',
          body: '',
          image: '',
          selectedIds: [],
          userId: '',
        }));
      } finally {
        setSaving(false);
      }
    })();
  };

  const toggleUser = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter((x) => x !== id)
        : [...prev.selectedIds, id],
    }));
  };

  const roleLabel = (role?: string) => {
    if (role === 'admin') return 'مدير';
    if (role === 'driver') return 'سائق';
    if (role === 'customer') return 'عميل';
    return role ?? '—';
  };

  return (
    <form className="stack-form send-composer" onSubmit={onFormSubmit}>
      <div>
        <h3 className="send-composer__section-title">المستلمون</h3>
        <div className="send-targets" role="radiogroup" aria-label="اختيار المستلمين">
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={form.targetMode === opt.id}
              className={[
                'send-target',
                form.targetMode === opt.id ? 'send-target--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setForm({ ...form, targetMode: opt.id })}
            >
              <strong>{opt.label}</strong>
              <span>{opt.hint}</span>
            </button>
          ))}
        </div>
        <p className="send-composer__estimate">
          المستلمون المتوقعون: <strong>{estimatedCount}</strong>
        </p>
      </div>

      {form.targetMode === 'one' ? (
        <Select
          label="المستخدم"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          required
        >
          <option value="">اختر مستخدماً</option>
          {activeUsers.map((user) => (
            <option key={getId(user)} value={getId(user)}>
              {user.name ?? user.email} — {roleLabel(user.role)}
            </option>
          ))}
        </Select>
      ) : null}

      {form.targetMode === 'some' ? (
        <div className="send-user-picker panel panel--muted">
          <div className="row-form">
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={form.userFilter}
              onChange={(e) => setForm({ ...form, userFilter: e.target.value })}
            />
            <Select
              value={form.filterRole}
              onChange={(e) => setForm({ ...form, filterRole: e.target.value })}
            >
              <option value="all">كل الأدوار</option>
              <option value="admin">مدراء</option>
              <option value="driver">سائقون</option>
              <option value="customer">عملاء</option>
            </Select>
          </div>
          <div className="send-user-picker__list">
            {selectableUsers.length === 0 ? (
              <p className="muted">لا يوجد مستخدمون</p>
            ) : (
              selectableUsers.map((user) => {
                const id = getId(user);
                return (
                  <label key={id} className="checkbox-row send-user-picker__row">
                    <input
                      type="checkbox"
                      checked={form.selectedIds.includes(id)}
                      onChange={() => toggleUser(id)}
                    />
                    <span>
                      {user.name ?? user.email}
                      <small> · {roleLabel(user.role)}</small>
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <p className="muted">محدّد: {form.selectedIds.length}</p>
        </div>
      ) : null}

      <h3 className="send-composer__section-title">محتوى الإشعار</h3>
      <Input
        required
        label="العنوان"
        placeholder="عنوان الإشعار"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <label className="field">
        <span className="field__label">النص</span>
        <textarea
          required
          className="input"
          rows={4}
          placeholder="نص الإشعار"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </label>
      <Input
        label="رابط الصورة (اختياري)"
        placeholder="https://..."
        value={form.image}
        onChange={(e) => setForm({ ...form, image: e.target.value })}
      />
      <div className="row-form">
        <Select
          label="النوع"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
        <Select
          label="الفئة"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
        <Select
          label="الأولوية"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
      </div>
      <Input
        label="رابط الإجراء (اختياري)"
        placeholder="/notifications أو مسار داخل التطبيق"
        value={form.actionUrl}
        onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
      />
      {initialScheduledAt ? (
        <Input
          required
          label="موعد الإرسال"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
        />
      ) : null}
      <div className="panel panel--muted send-preview">
        <strong>معاينة</strong>
        <p className="send-preview__title">{form.title || 'العنوان'}</p>
        <p>{form.body || 'النص'}</p>
        <p className="muted">سيصل إلى {estimatedCount} مستلم · يشمل لوحة التحكم إن كان المستلم مديراً</p>
      </div>
      <Button type="submit" disabled={saving || estimatedCount === 0}>
        {submitLabel}
      </Button>
    </form>
  );
}

function SendView({
  users,
  onToast,
}: {
  users: User[];
  onToast: (message: string) => void;
}) {
  return (
    <section className="panel send-page">
      <header className="send-page__header">
        <div>
          <h2>إرسال إشعار</h2>
          <p className="muted">
            أرسل للجميع، أو السائقين، أو العملاء، أو كليهما، أو مستخدمين محددين، أو لوحة التحكم (المدراء).
          </p>
        </div>
      </header>
      <ComposerForm
        users={users}
        submitLabel="إرسال الآن"
        onSubmit={async (body) => {
          const { scheduledAt: _, ...payload } = body;
          const res = await AdminApi.notifications.send(payload);
          onToast(`تم الإرسال إلى ${res.data.count} مستلم`);
        }}
      />
    </section>
  );
}

function ScheduledView({
  users,
  onToast,
}: {
  users: User[];
  onToast: (message: string) => void;
}) {
  const [items, setItems] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminApi.notifications.listScheduled();
      setItems(res.data);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="panel">
        <h2>جدولة إشعار</h2>
        <ComposerForm
          users={users}
          submitLabel="جدولة"
          initialScheduledAt
          onSubmit={async (body) => {
            if (!body.scheduledAt) throw new Error('موعد الجدولة مطلوب');
            const scheduledAt = new Date(body.scheduledAt).toISOString();
            await AdminApi.notifications.schedule({ ...body, scheduledAt });
            onToast('تمت الجدولة');
            await load();
          }}
        />
      </section>

      <DataTable
        title={`المجدولة (${items.length})`}
        rows={items.map((item) => ({ ...item, id: getId(item) }))}
        loading={loading}
        columns={[
          { key: 'title', label: 'العنوان' },
          { key: 'status', label: 'الحالة' },
          {
            key: 'scheduledAt',
            label: 'الموعد',
            render: (r) => formatDateTime(r.scheduledAt),
          },
          {
            key: 'actions',
            label: COMMON.actions,
            render: (row) =>
              row.status === 'scheduled' ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void (async () => {
                      await AdminApi.notifications.cancelScheduled(getId(row));
                      onToast('تم الإلغاء');
                      await load();
                    })();
                  }}
                >
                  إلغاء
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </>
  );
}

function TemplatesView({ onToast }: { onToast: (message: string) => void }) {
  const [items, setItems] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    titleTemplate: '',
    bodyTemplate: '',
    variables: '',
    type: 'system',
    category: 'general',
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminApi.notifications.templates.list();
      setItems(res.data);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'تعذر التحميل');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (item: NotificationTemplate) => {
    setEditing(item);
    setForm({
      name: item.name ?? '',
      code: item.code ?? '',
      titleTemplate: item.titleTemplate ?? '',
      bodyTemplate: item.bodyTemplate ?? '',
      variables: (item.variables ?? []).join(', '),
      type: item.type ?? 'system',
      category: item.category ?? 'general',
      isActive: item.isActive !== false,
    });
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    void (async () => {
      const payload = {
        name: form.name,
        code: form.code,
        titleTemplate: form.titleTemplate,
        bodyTemplate: form.bodyTemplate,
        variables: form.variables
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.type,
        category: form.category,
        isActive: form.isActive,
      };
      try {
        if (editing) {
          await AdminApi.notifications.templates.update(getId(editing), payload);
          onToast('تم تحديث القالب');
        } else {
          await AdminApi.notifications.templates.create(payload);
          onToast('تم إنشاء القالب');
        }
        setEditing(null);
        setForm({
          name: '',
          code: '',
          titleTemplate: '',
          bodyTemplate: '',
          variables: '',
          type: 'system',
          category: 'general',
          isActive: true,
        });
        await load();
      } catch (error) {
        onToast(error instanceof Error ? error.message : 'تعذر الحفظ');
      }
    })();
  };

  return (
    <>
      <section className="panel">
        <h2>{editing ? 'تعديل قالب' : 'قالب جديد'}</h2>
        <p className="muted">المتغيرات: استخدم {'{{name}}'} داخل العنوان أو النص</p>
        <form className="stack-form" onSubmit={onSave}>
          <div className="row-form">
            <Input
              required
              placeholder="الاسم"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              required
              placeholder="الرمز (CODE)"
              value={form.code}
              disabled={Boolean(editing)}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <Input
            required
            placeholder="قالب العنوان"
            value={form.titleTemplate}
            onChange={(e) => setForm({ ...form, titleTemplate: e.target.value })}
          />
          <textarea
            required
            className="input"
            rows={3}
            placeholder="قالب النص"
            value={form.bodyTemplate}
            onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })}
          />
          <Input
            placeholder="المتغيرات (مفصولة بفواصل)"
            value={form.variables}
            onChange={(e) => setForm({ ...form, variables: e.target.value })}
          />
          <div className="row-form">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              نشط
            </label>
          </div>
          <div className="row-form">
            <Button type="submit">{COMMON.save}</Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                {COMMON.cancel}
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <DataTable
        title={`القوالب (${items.length})`}
        rows={items.map((item) => ({ ...item, id: getId(item) }))}
        loading={loading}
        columns={[
          { key: 'code', label: 'الرمز' },
          { key: 'name', label: 'الاسم' },
          { key: 'type', label: 'النوع' },
          {
            key: 'isActive',
            label: 'نشط',
            render: (r) => (r.isActive === false ? 'لا' : 'نعم'),
          },
          {
            key: 'actions',
            label: COMMON.actions,
            render: (row) => (
              <div className="row-form">
                <Button type="button" variant="ghost" onClick={() => startEdit(row)}>
                  {COMMON.edit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void (async () => {
                      await AdminApi.notifications.templates.remove(getId(row));
                      onToast('تم الحذف');
                      await load();
                    })();
                  }}
                >
                  {COMMON.delete}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

function AnalyticsView({ onToast }: { onToast: (message: string) => void }) {
  const [data, setData] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await AdminApi.notifications.analytics({ granularity });
        if (!cancelled) setData(res.data);
      } catch (error) {
        onToast(error instanceof Error ? error.message : 'تعذر التحميل');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [granularity, onToast]);

  const maxSent = Math.max(1, ...(data?.series.map((s) => s.sent) ?? [1]));

  return (
    <>
      <section className="panel">
        <div className="row-form">
          <Select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
          >
            <option value="day">يومي</option>
            <option value="week">أسبوعي</option>
            <option value="month">شهري</option>
          </Select>
          <StatusBadge status={data?.firebaseEnabled ? 'active' : 'inactive'} />
        </div>
      </section>

      {loading || !data ? (
        <p>{COMMON.loading}</p>
      ) : (
        <>
          <div className="kpi-grid">
            <KpiStat label="المرسلة" value={data.totalSent} />
            <KpiStat label="المسلّمة" value={data.totalDelivered} tone="success" />
            <KpiStat label="المفتوحة" value={data.totalOpened} />
            <KpiStat label="الفاشلة" value={data.failed} tone="danger" />
            <KpiStat label="معدل التسليم" value={`${data.deliveryRate}%`} />
            <KpiStat label="معدل الفتح" value={`${data.openRate}%`} />
          </div>

          <section className="panel">
            <h2>السلسلة الزمنية</h2>
            <div className="notif-bars">
              {data.series.map((point) => (
                <div key={point.date} className="notif-bars__item" title={`${point.date}: ${point.sent}`}>
                  <div
                    className="notif-bars__bar"
                    style={{ height: `${Math.max(8, (point.sent / maxSent) * 120)}px` }}
                  />
                  <span className="notif-bars__label">{point.date.slice(5)}</span>
                </div>
              ))}
              {data.series.length === 0 ? <p>{COMMON.noData}</p> : null}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function SettingsView({ onToast }: { onToast: (message: string) => void }) {
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [firebaseEnabled, setFirebaseEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [prefRes, analyticsRes] = await Promise.all([
          AdminApi.notifications.inbox.preferences(),
          AdminApi.notifications.analytics({ granularity: 'day' }),
        ]);
        setPrefs(prefRes.data);
        setFirebaseEnabled(analyticsRes.data.firebaseEnabled);
      } catch (error) {
        onToast(error instanceof Error ? error.message : 'تعذر التحميل');
      } finally {
        setLoading(false);
      }
    })();
  }, [onToast]);

  if (loading || !prefs) return <p>{COMMON.loading}</p>;

  return (
    <section className="panel">
      <h2>إعدادات الإشعارات</h2>
      <p>
        حالة Firebase FCM:{' '}
        <StatusBadge status={firebaseEnabled ? 'active' : 'inactive'} />
      </p>
      <form
        className="stack-form"
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            try {
              const res = await AdminApi.notifications.inbox.updatePreferences({
                enabled: prefs.enabled,
                pushEnabled: prefs.pushEnabled,
                emailEnabled: prefs.emailEnabled,
              });
              setPrefs(res.data);
              onToast('تم حفظ التفضيلات');
            } catch (error) {
              onToast(error instanceof Error ? error.message : 'تعذر الحفظ');
            }
          })();
        }}
      >
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={prefs.enabled !== false}
            onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
          />
          تفعيل الإشعارات
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={prefs.pushEnabled !== false}
            onChange={(e) => setPrefs({ ...prefs, pushEnabled: e.target.checked })}
          />
          تفعيل الدفع (Push)
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(prefs.emailEnabled)}
            onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
          />
          تفضيل البريد (مخزّن فقط — الإرسال غير مفعّل)
        </label>
        <Button type="submit">{COMMON.save}</Button>
      </form>
    </section>
  );
}

type NotificationsPageProps = {
  users: User[];
  onToast: (message: string) => void;
};

export function NotificationsPage({ users, onToast }: NotificationsPageProps) {
  return (
    <div className="notifications-page">
      <NotificationsSubNav />
      <Routes>
        <Route index element={<ListView onToast={onToast} />} />
        <Route path="send" element={<SendView users={users} onToast={onToast} />} />
        <Route path="scheduled" element={<ScheduledView users={users} onToast={onToast} />} />
        <Route path="templates" element={<TemplatesView onToast={onToast} />} />
        <Route path="analytics" element={<AnalyticsView onToast={onToast} />} />
        <Route path="settings" element={<SettingsView onToast={onToast} />} />
        <Route path=":id" element={<DetailView onToast={onToast} />} />
        <Route path="*" element={<Navigate to="/notifications" replace />} />
      </Routes>
    </div>
  );
}

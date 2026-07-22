import { FormEvent, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  bindTicketSocket,
  createTicketSocket,
  joinTicketRoom,
  leaveTicketRoom,
  unbindTicketSocket,
} from '../../api/ticket-socket';
import { AdminApi } from '../../api/modules';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COMMON } from '../../i18n/ar';
import type { Ticket, TicketMessage, User } from '../../types';
import { getId, userNameById } from './shared';
import type { Socket } from 'socket.io-client';

type TicketChatPageProps = {
  tickets: Ticket[];
  users: User[];
  accessToken: string;
  onUpdate: (
    id: string,
    body: {
      status?: Ticket['status'];
      priority?: Ticket['priority'];
      assigneeId?: string;
    },
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
};

const TICKET_STATUSES = [
  'pending',
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const;

const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلقة',
};

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('ar-LY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

function sameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function dayLabel(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (sameDay(value, today.toISOString())) return 'اليوم';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(value, yesterday.toISOString())) return 'أمس';
  return date.toLocaleDateString('ar-LY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function TicketChatPage({
  tickets,
  users,
  accessToken,
  onUpdate,
  onRefresh,
}: TicketChatPageProps) {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const listed = useMemo(
    () => tickets.find((ticket) => getId(ticket) === id) ?? null,
    [id, tickets],
  );

  const [ticket, setTicket] = useState<Ticket | null>(listed);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'pending' as Ticket['status'],
    priority: 'medium' as Ticket['priority'],
    assigneeId: '',
  });
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const staffUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === 'admin' ||
          user.role === 'manager' ||
          user.role === 'supervisor',
      ),
    [users],
  );

  const owner = useMemo(
    () => (ticket ? users.find((u) => getId(u) === ticket.userId) : undefined),
    [ticket, users],
  );
  const isDriver = owner?.role === 'driver';

  useEffect(() => {
    if (listed) setTicket(listed);
  }, [listed]);

  useEffect(() => {
    if (!id) return;
    setMessagesLoading(true);
    void AdminApi.tickets
      .get(id)
      .then((res) => {
        setTicket(res.data);
        setEditForm({
          status: res.data.status ?? 'pending',
          priority: res.data.priority ?? 'medium',
          assigneeId: res.data.assigneeId ?? '',
        });
      })
      .catch(() => undefined);

    void AdminApi.tickets
      .listMessages(id, 1, 200)
      .then((res) => setMessages(res.data.items))
      .finally(() => setMessagesLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !accessToken) return;

    const socket = createTicketSocket(accessToken);
    socketRef.current = socket;

    bindTicketSocket(socket, {
      onMessage: (message) => {
        if (message.ticketId !== id) return;
        setMessages((prev) => {
          if (prev.some((item) => getId(item) === getId(message))) return prev;
          return [...prev, message];
        });
      },
      onTicketUpdated: (updated) => {
        if (getId(updated) !== id) return;
        setTicket(updated);
        setEditForm({
          status: updated.status ?? 'pending',
          priority: updated.priority ?? 'medium',
          assigneeId: updated.assigneeId ?? '',
        });
        void onRefresh();
      },
    });

    socket.on('connect', () => {
      joinTicketRoom(socket, id);
    });

    return () => {
      leaveTicketRoom(socket, id);
      unbindTicketSocket(socket);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, id, onRefresh]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, id]);

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    setSaving(true);
    try {
      await onUpdate(getId(ticket), {
        status: editForm.status,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId || undefined,
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitReply(e?: FormEvent) {
    e?.preventDefault();
    if (!ticket || !reply.trim()) return;
    const ticketId = getId(ticket);
    const body = reply.trim();
    setSaving(true);
    try {
      const res = await AdminApi.tickets.sendMessage(ticketId, body);
      setMessages((prev) => {
        if (prev.some((item) => getId(item) === getId(res.data))) return prev;
        return [...prev, res.data];
      });
      setReply('');
      composerRef.current?.focus();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitReply();
    }
  }

  if (!ticket && !messagesLoading) {
    return (
      <div className="module-page customer-detail-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/tickets')}>
          ← العودة إلى التذاكر
        </Button>
        <div className="customer-empty">
          <h2>التذكرة غير موجودة</h2>
          <p>تعذر العثور على هذه التذكرة أو تم حذفها.</p>
          <Button type="button" onClick={() => navigate('/tickets')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-chat-page">
      <header className="ticket-chat-header">
        <div className="ticket-chat-header__main">
          <Button type="button" variant="ghost" onClick={() => navigate('/tickets')}>
            ← التذاكر
          </Button>
          <div className="ticket-chat-header__titles">
            <div className="ticket-chat-header__row">
              <h2>{ticket?.ticketNumber ?? 'تذكرة دعم'}</h2>
              {ticket?.status ? <StatusBadge status={ticket.status} /> : null}
              {ticket?.priority ? <StatusBadge status={ticket.priority} /> : null}
            </div>
            <p className="ticket-chat-header__subject">{ticket?.subject ?? '—'}</p>
            <div className="ticket-chat-header__meta">
              <span>
                {isDriver ? 'سائق' : 'عميل'}:{' '}
                {ticket?.userName ?? userNameById(users, ticket?.userId)}
              </span>
              <span>
                المسؤول:{' '}
                {ticket?.assigneeId
                  ? userNameById(users, ticket.assigneeId)
                  : 'غير معيّن'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="ticket-chat-layout">
        <section className="ticket-chat-main">
          <div className="ticket-chat-thread" aria-live="polite">
            {messagesLoading ? (
              <p className="ticket-chat-empty">{COMMON.loading}</p>
            ) : messages.length === 0 ? (
              <div className="ticket-chat-empty">
                <strong>ابدأ المحادثة</strong>
                <p>لا توجد رسائل بعد. أرسل أول رد للعميل أو السائق.</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const prev = messages[index - 1];
                const showDay =
                  !prev || !sameDay(prev.createdAt, message.createdAt);
                const isStaff = message.senderRole === 'admin';
                const isDriverMsg = message.senderRole === 'driver';
                const senderLabel = isStaff
                  ? userNameById(users, message.senderId) || 'الدعم'
                  : isDriverMsg
                    ? 'السائق'
                    : 'العميل';

                return (
                  <div key={getId(message)}>
                    {showDay ? (
                      <div className="ticket-chat-day">
                        <span>{dayLabel(message.createdAt)}</span>
                      </div>
                    ) : null}
                    <div
                      className={`ticket-msg ${
                        isStaff ? 'ticket-msg--out' : 'ticket-msg--in'
                      }`}
                    >
                      <div className="ticket-msg__bubble">
                        <div className="ticket-msg__meta">
                          <strong>{senderLabel}</strong>
                          <time>{formatTime(message.createdAt)}</time>
                        </div>
                        <p className="ticket-msg__body">{message.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="ticket-chat-composer" onSubmit={(e) => void submitReply(e)}>
            <textarea
              ref={composerRef}
              className="ticket-chat-composer__input"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="اكتب ردك… (Enter للإرسال، Shift+Enter لسطر جديد)"
              rows={2}
              disabled={
                saving ||
                ticket?.status === 'closed' ||
                ticket?.status === 'resolved'
              }
            />
            <Button
              type="submit"
              disabled={
                saving ||
                !reply.trim() ||
                ticket?.status === 'closed' ||
                ticket?.status === 'resolved'
              }
            >
              إرسال
            </Button>
          </form>
        </section>

        <aside className="ticket-chat-sidebar">
          <section className="ticket-chat-card">
            <h3>تفاصيل التذكرة</h3>
            <dl className="info-list">
              <div className="info-list__row">
                <dt>{isDriver ? 'السائق' : 'العميل'}</dt>
                <dd>{ticket?.userName ?? userNameById(users, ticket?.userId)}</dd>
              </div>
              <div className="info-list__row">
                <dt>الحالة</dt>
                <dd>
                  {STATUS_LABELS[ticket?.status ?? ''] ?? ticket?.status ?? '—'}
                </dd>
              </div>
              <div className="info-list__row">
                <dt>الأولوية</dt>
                <dd>
                  {PRIORITY_LABELS[ticket?.priority ?? ''] ??
                    ticket?.priority ??
                    '—'}
                </dd>
              </div>
              <div className="info-list__row">
                <dt>تاريخ الإنشاء</dt>
                <dd>{formatDateTime(ticket?.createdAt)}</dd>
              </div>
              <div className="info-list__row">
                <dt>الوصف</dt>
                <dd>{ticket?.description ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="ticket-chat-card">
            <h3>إدارة التذكرة</h3>
            <form className="detail-form" onSubmit={submitUpdate}>
              <Select
                label={COMMON.status}
                value={editForm.status ?? 'pending'}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as Ticket['status'],
                  })
                }
              >
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </Select>
              <Select
                label="الأولوية"
                value={editForm.priority ?? 'medium'}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    priority: e.target.value as Ticket['priority'],
                  })
                }
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
              <Select
                label="المسؤول"
                value={editForm.assigneeId}
                onChange={(e) =>
                  setEditForm({ ...editForm, assigneeId: e.target.value })
                }
              >
                <option value="">غير معيّن</option>
                {staffUsers.map((user) => (
                  <option key={getId(user)} value={getId(user)}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={saving || !ticket}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

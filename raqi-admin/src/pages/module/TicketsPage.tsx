import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { DetailPanel } from '../../components/forms/DetailPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  bindTicketSocket,
  createTicketSocket,
  joinTicketRoom,
  leaveTicketRoom,
  unbindTicketSocket,
} from '../../api/ticket-socket';
import { AdminApi } from '../../api/modules';
import { COMMON } from '../../i18n/ar';
import type { Ticket, TicketMessage, User } from '../../types';
import { getId, userNameById } from './shared';
import type { Socket } from 'socket.io-client';

type TicketsPageProps = {
  tickets: Ticket[];
  users: User[];
  accessToken: string;
  loading?: boolean;
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

const TICKET_STATUSES: Ticket['status'][] = [
  'pending',
  'open',
  'in_progress',
  'resolved',
  'closed',
];

const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-LY');
}

export function TicketsPage({
  tickets,
  users,
  accessToken,
  loading = false,
  onUpdate,
  onRefresh,
}: TicketsPageProps) {
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'pending' as Ticket['status'],
    priority: 'medium' as Ticket['priority'],
    assigneeId: '',
  });
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const adminUsers = useMemo(
    () => users.filter((user) => user.role === 'admin'),
    [users],
  );

  const tableRows = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        customerName: ticket.userName ?? userNameById(users, ticket.userId),
        assigneeName: ticket.assigneeId
          ? userNameById(users, ticket.assigneeId)
          : '—',
        priorityLabel: PRIORITY_LABELS[ticket.priority ?? 'medium'] ?? ticket.priority,
        lastMessageLabel: formatDateTime(ticket.lastMessageAt),
      })),
    [tickets, users],
  );

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      setReply('');
      return;
    }

    setEditForm({
      status: selected.status ?? 'pending',
      priority: selected.priority ?? 'medium',
      assigneeId: selected.assigneeId ?? '',
    });

    const ticketId = getId(selected);
    setMessagesLoading(true);
    void AdminApi.tickets
      .listMessages(ticketId, 1, 200)
      .then((res) => setMessages(res.data.items))
      .finally(() => setMessagesLoading(false));
  }, [selected?.id, selected?._id]);

  useEffect(() => {
    if (!selected || !accessToken) return;

    const ticketId = getId(selected);
    const socket = createTicketSocket(accessToken);
    socketRef.current = socket;

    bindTicketSocket(socket, {
      onMessage: (message) => {
        if (message.ticketId !== ticketId) return;
        setMessages((prev) => {
          if (prev.some((item) => getId(item) === getId(message))) return prev;
          return [...prev, message];
        });
      },
      onTicketUpdated: (ticket) => {
        if (getId(ticket) !== ticketId) return;
        setSelected(ticket);
        setEditForm({
          status: ticket.status ?? 'pending',
          priority: ticket.priority ?? 'medium',
          assigneeId: ticket.assigneeId ?? '',
        });
        void onRefresh();
      },
    });

    socket.on('connect', () => {
      joinTicketRoom(socket, ticketId);
    });

    return () => {
      leaveTicketRoom(socket, ticketId);
      unbindTicketSocket(socket);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, onRefresh, selected?.id, selected?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected?.id]);

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(getId(selected), {
        status: editForm.status,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitReply(e: FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    const ticketId = getId(selected);
    const body = reply.trim();
    setSaving(true);
    try {
      const res = await AdminApi.tickets.sendMessage(ticketId, body);
      setMessages((prev) => {
        if (prev.some((item) => getId(item) === getId(res.data))) return prev;
        return [...prev, res.data];
      });
      setReply('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`module-page ${selected ? 'module-page--with-detail' : ''}`}>
      <DataTable
        title="تذاكر الدعم"
        description="متابعة طلبات الدعم والمحادثة مع العملاء"
        rows={tableRows}
        loading={loading}
        onSelect={setSelected}
        searchKeys={[
          'ticketNumber',
          'customerName',
          'subject',
          'status',
          'priorityLabel',
          'assigneeName',
        ]}
        columns={[
          { key: 'ticketNumber', label: 'رقم التذكرة' },
          { key: 'customerName', label: 'العميل' },
          { key: 'subject', label: 'الموضوع' },
          {
            key: 'status',
            label: COMMON.status,
            render: (row) => <StatusBadge status={String(row.status)} />,
            sortable: false,
          },
          {
            key: 'priorityLabel',
            label: 'الأولوية',
            render: (row) => <StatusBadge status={String(row.priority)} />,
            sortable: false,
          },
          { key: 'assigneeName', label: 'المسؤول' },
          { key: 'lastMessageLabel', label: 'آخر رسالة' },
        ]}
      />

      {selected ? (
        <DetailPanel
          title={selected.ticketNumber ?? 'تذكرة دعم'}
          subtitle={selected.subject}
          onClose={() => setSelected(null)}
        >
          <div className="detail-stack">
            <section className="detail-block">
              <h4 className="detail-block__title">معلومات التذكرة</h4>
              <dl className="info-list">
                <div className="info-list__row">
                  <dt>العميل</dt>
                  <dd>{selected.userName ?? userNameById(users, selected.userId)}</dd>
                </div>
                <div className="info-list__row">
                  <dt>الوصف</dt>
                  <dd>{selected.description ?? '—'}</dd>
                </div>
                <div className="info-list__row">
                  <dt>تاريخ الإنشاء</dt>
                  <dd>{formatDateTime(selected.createdAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">إدارة التذكرة</h4>
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
                      {status}
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
                  {adminUsers.map((user) => (
                    <option key={getId(user)} value={getId(user)}>
                      {user.name ?? user.email}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : COMMON.save}
                </Button>
              </form>
            </section>

            <section className="detail-block">
              <h4 className="detail-block__title">المحادثة</h4>
              {messagesLoading ? (
                <p className="detail-block__muted">{COMMON.loading}</p>
              ) : (
                <div className="chat-thread">
                  {messages.length === 0 ? (
                    <p className="detail-block__muted">لا توجد رسائل بعد.</p>
                  ) : (
                    messages.map((message) => {
                      const isAdmin = message.senderRole === 'admin';
                      return (
                        <div
                          key={getId(message)}
                          className={`chat-bubble ${
                            isAdmin ? 'chat-bubble--admin' : 'chat-bubble--customer'
                          }`}
                        >
                          <div className="chat-bubble__meta">
                            <strong>
                              {isAdmin
                                ? userNameById(users, message.senderId)
                                : 'العميل'}
                            </strong>
                            <span>{formatDateTime(message.createdAt)}</span>
                          </div>
                          <p>{message.body}</p>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
              <form className="chat-input detail-form" onSubmit={submitReply}>
                <Input
                  label="رد جديد"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردك للعميل..."
                  required
                />
                <Button type="submit" disabled={saving || !reply.trim()}>
                  إرسال
                </Button>
              </form>
            </section>
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuVolume2, LuVolumeX } from 'react-icons/lu';
import type { Socket } from 'socket.io-client';
import { AdminApi } from '../api/modules';
import {
  bindNotificationSocket,
  createNotificationSocket,
  unbindNotificationSocket,
} from '../api/notification-socket';
import {
  bindNotificationSoundUnlock,
  getNotificationSoundMuted,
  playNotificationSound,
  setNotificationSoundMuted,
  unlockNotificationSound,
} from '../lib/notification-sound';
import { getId } from '../pages/module/shared';
import type { AppNotification } from '../types';
import { Button } from './ui/Button';

type NotificationBellProps = {
  accessToken: string;
};

export function NotificationBell({ accessToken }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [soundMuted, setSoundMuted] = useState(() => getNotificationSoundMuted());
  const socketRef = useRef<Socket | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const knownCountRef = useRef<number | null>(null);
  const primedRef = useRef(false);

  const primeSound = useCallback(() => {
    if (primedRef.current) return;
    primedRef.current = true;
    void unlockNotificationSound();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        AdminApi.notifications.inbox.unreadCount(),
        AdminApi.notifications.inbox.list({ page: 1, limit: 10 }),
      ]);
      const nextCount = countRes.data.count;
      if (
        knownCountRef.current !== null &&
        nextCount > knownCountRef.current
      ) {
        void playNotificationSound();
      }
      knownCountRef.current = nextCount;
      setCount(nextCount);
      setItems(listRes.data.items);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    bindNotificationSoundUnlock();
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = createNotificationSocket(accessToken);
    socketRef.current = socket;
    bindNotificationSocket(socket, {
      onCreated: (notification) => {
        setItems((prev) => [notification, ...prev].slice(0, 10));
        setCount((prev) => {
          const next = prev + 1;
          knownCountRef.current = next;
          return next;
        });
        void playNotificationSound();
      },
      onUnreadCount: ({ count: next }) => {
        knownCountRef.current = next;
        setCount(next);
      },
      onRead: ({ unreadCount }) => {
        knownCountRef.current = unreadCount;
        setCount(unreadCount);
      },
    });
    return () => {
      unbindNotificationSocket(socket);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const markRead = async (item: AppNotification) => {
    const id = getId(item);
    if (!id) return;
    try {
      if (!item.isRead) {
        await AdminApi.notifications.inbox.markRead(id);
        setItems((prev) =>
          prev.map((row) => (getId(row) === id ? { ...row, isRead: true } : row)),
        );
      }
      setOpen(false);
      if (item.actionUrl?.startsWith('/')) {
        navigate(item.actionUrl);
      } else if (item.referenceType === 'ticket' && item.referenceId) {
        navigate('/tickets');
      } else {
        navigate(`/notifications/${id}`);
      }
    } catch {
      /* ignore */
    }
  };

  const toggleSound = () => {
    primeSound();
    const next = !soundMuted;
    setNotificationSoundMuted(next);
    setSoundMuted(next);
    if (!next) {
      void playNotificationSound();
    }
  };

  return (
    <div className="notif-bell" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        className="btn--icon notif-bell__button"
        aria-label="الإشعارات"
        title="الإشعارات"
        onClick={() => {
          primeSound();
          setOpen((prev) => !prev);
          void refresh();
        }}
      >
        <LuBell />
        {count > 0 ? (
          <span className="notif-bell__badge">{count > 99 ? '99+' : count}</span>
        ) : null}
      </Button>

      {open ? (
        <div className="notif-bell__dropdown" role="menu">
          <div className="notif-bell__header">
            <strong>الإشعارات</strong>
            <div className="notif-bell__header-actions">
              <button
                type="button"
                className="link-btn notif-bell__sound-toggle"
                onClick={toggleSound}
                title={soundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
                aria-label={soundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
              >
                {soundMuted ? <LuVolumeX /> : <LuVolume2 />}
              </button>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  void AdminApi.notifications.inbox.markAllRead().then(() => {
                    knownCountRef.current = 0;
                    setCount(0);
                    setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
                  });
                }}
              >
                تعليم الكل كمقروء
              </button>
            </div>
          </div>
          <ul className="notif-bell__list">
            {items.length === 0 ? (
              <li className="notif-bell__empty">لا توجد إشعارات</li>
            ) : (
              items.map((item) => (
                <li key={getId(item)}>
                  <button
                    type="button"
                    className={[
                      'notif-bell__item',
                      item.isRead ? '' : 'notif-bell__item--unread',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => void markRead(item)}
                  >
                    <span className="notif-bell__title">{item.title}</span>
                    <span className="notif-bell__body">{item.body}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            className="notif-bell__footer"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            عرض الكل
          </button>
        </div>
      ) : null}
    </div>
  );
}

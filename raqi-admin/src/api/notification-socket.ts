import { io, type Socket } from 'socket.io-client';
import type { AppNotification } from '../types';

function socketOrigin() {
  const explicit = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '');
  if (explicit) return explicit;
  return window.location.origin;
}

export function createNotificationSocket(accessToken: string): Socket {
  return io(`${socketOrigin()}/notifications`, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
  });
}

export type NotificationSocketHandlers = {
  onCreated?: (notification: AppNotification) => void;
  onUnreadCount?: (payload: { count: number }) => void;
  onRead?: (payload: { id: string; unreadCount: number }) => void;
};

export function bindNotificationSocket(
  socket: Socket,
  handlers: NotificationSocketHandlers,
) {
  if (handlers.onCreated) {
    socket.on('notification_created', handlers.onCreated);
  }
  if (handlers.onUnreadCount) {
    socket.on('unread_count', handlers.onUnreadCount);
  }
  if (handlers.onRead) {
    socket.on('notification_read', handlers.onRead);
  }
}

export function unbindNotificationSocket(socket: Socket) {
  socket.off('notification_created');
  socket.off('unread_count');
  socket.off('notification_read');
}

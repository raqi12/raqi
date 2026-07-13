import { io, type Socket } from 'socket.io-client';
import type { Ticket, TicketMessage } from '../types';

function socketOrigin() {
  const explicit = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '');
  if (explicit) return explicit;
  return window.location.origin;
}

export function createTicketSocket(accessToken: string): Socket {
  return io(`${socketOrigin()}/tickets`, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
  });
}

export type TicketSocketHandlers = {
  onMessage?: (message: TicketMessage) => void;
  onTicketUpdated?: (ticket: Ticket) => void;
};

export function bindTicketSocket(socket: Socket, handlers: TicketSocketHandlers) {
  if (handlers.onMessage) {
    socket.on('message_created', handlers.onMessage);
  }
  if (handlers.onTicketUpdated) {
    socket.on('ticket_updated', handlers.onTicketUpdated);
  }
}

export function unbindTicketSocket(socket: Socket) {
  socket.off('message_created');
  socket.off('ticket_updated');
}

export function joinTicketRoom(socket: Socket, ticketId: string) {
  socket.emit('join_ticket', { ticketId });
}

export function leaveTicketRoom(socket: Socket, ticketId: string) {
  socket.emit('leave_ticket', { ticketId });
}

export function sendTicketSocketMessage(
  socket: Socket,
  ticketId: string,
  body: string,
) {
  socket.emit('send_message', { ticketId, body });
}

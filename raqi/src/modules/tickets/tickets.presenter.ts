import type { TicketDto, TicketMessageDto } from '../../common/swagger/schemas/entity.schemas';

export function toTicketDto(
  ticket: {
    id?: string;
    _id?: unknown;
    ticketNumber: string;
    userId: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    assigneeId?: string | null;
    closedAt?: Date | null;
    lastMessageAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
  },
  userName?: string,
): TicketDto {
  return {
    id: String(ticket.id ?? ticket._id),
    ticketNumber: ticket.ticketNumber,
    userId: ticket.userId,
    userName,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    assigneeId: ticket.assigneeId ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    lastMessageAt: ticket.lastMessageAt.toISOString(),
    createdAt: ticket.createdAt?.toISOString(),
    updatedAt: ticket.updatedAt?.toISOString(),
  };
}

export function toMessageDto(message: {
  id?: string;
  _id?: unknown;
  ticketId: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt?: Date;
}): TicketMessageDto {
  return {
    id: String(message.id ?? message._id),
    ticketId: message.ticketId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: message.body,
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export const TICKET_STATUSES = [
  'pending',
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_MESSAGE_SENDER_ROLES = ['customer', 'admin'] as const;

export type TicketMessageSenderRole = (typeof TICKET_MESSAGE_SENDER_ROLES)[number];

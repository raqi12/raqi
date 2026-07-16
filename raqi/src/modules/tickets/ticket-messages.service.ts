import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../../common/roles.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import {
  TicketMessage,
  TicketMessageDocument,
} from './schemas/ticket-message.schema';
import type { TicketMessageSenderRole } from './ticket.enums';
import { TicketsService } from './tickets.service';

export type PaginatedMessages = {
  items: TicketMessageDocument[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

@Injectable()
export class TicketMessagesService {
  constructor(
    @InjectModel(TicketMessage.name)
    private readonly messageModel: Model<TicketMessageDocument>,
    private readonly ticketsService: TicketsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  create(input: {
    ticketId: string;
    senderId: string;
    senderRole: TicketMessageSenderRole;
    body: string;
  }): Promise<TicketMessageDocument> {
    return this.messageModel.create(input);
  }

  async list(
    ticketId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedMessages> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.messageModel
        .find({ ticketId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.messageModel.countDocuments({ ticketId }).exec(),
    ]);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async sendMessage(input: {
    ticketId: string;
    senderId: string;
    senderRole: TicketMessageSenderRole;
    body: string;
  }) {
    const ticket = await this.ticketsService.findByIdOrThrow(input.ticketId);
    const message = await this.create(input);
    await this.ticketsService.touchLastMessageAt(input.ticketId);
    const updatedTicket = await this.ticketsService.applyMessageSideEffects(
      ticket,
      input.senderRole,
    );

    let recipientIds: string[] = [];
    if (input.senderRole === 'admin') {
      recipientIds = [String(ticket.userId)];
    } else if (ticket.assigneeId) {
      recipientIds = [String(ticket.assigneeId)];
    } else {
      const admins = await this.usersService.findByRole(Role.Admin);
      recipientIds = admins.map((admin) => String(admin.id));
    }
    recipientIds = recipientIds.filter((id) => id && id !== input.senderId);
    if (recipientIds.length) {
      void this.notificationsService
        .notifyFromTemplate(
          'TICKET_REPLIED',
          recipientIds,
          { ticketNumber: ticket.ticketNumber },
          {
            referenceType: 'ticket',
            referenceId: String(ticket.id),
            actionUrl: `/tickets/${ticket.id}`,
          },
        )
        .catch(() => undefined);
    }

    return { message, ticket: updatedTicket };
  }

  createInitialMessage(
    ticketId: string,
    userId: string,
    body: string,
    senderRole: TicketMessageSenderRole = 'customer',
  ): Promise<TicketMessageDocument> {
    return this.create({
      ticketId,
      senderId: userId,
      senderRole,
      body,
    });
  }
}

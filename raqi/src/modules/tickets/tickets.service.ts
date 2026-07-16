import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import {
  TicketCounter,
  TicketCounterDocument,
} from './schemas/ticket-counter.schema';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import type { TicketPriority, TicketStatus } from './ticket.enums';
import type { TicketMessageSenderRole } from './ticket.enums';

export type TicketListFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  search?: string;
  userId?: string;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(TicketCounter.name)
    private readonly counterModel: Model<TicketCounterDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async generateTicketNumber(): Promise<string> {
    const now = new Date();
    const dateKey = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
    ].join('');

    const counter = await this.counterModel
      .findOneAndUpdate(
        { dateKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      )
      .exec();

    const seq = String(counter?.seq ?? 1).padStart(4, '0');
    return `TKT-${dateKey}-${seq}`;
  }

  async create(input: {
    userId: string;
    subject: string;
    description: string;
    priority?: TicketPriority;
  }): Promise<TicketDocument> {
    const now = new Date();
    const ticketNumber = await this.generateTicketNumber();
    const ticket = await this.ticketModel.create({
      ticketNumber,
      userId: input.userId,
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? 'medium',
      status: 'pending',
      assigneeId: null,
      closedAt: null,
      lastMessageAt: now,
    });

    const admins = await this.usersService.findByRole(Role.Admin);
    const adminIds = admins
      .map((admin) => String(admin.id))
      .filter((id) => id !== input.userId);
    if (adminIds.length) {
      void this.notificationsService
        .notifyFromTemplate(
          'TICKET_CREATED',
          adminIds,
          {
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
          },
          {
            referenceType: 'ticket',
            referenceId: String(ticket.id),
            actionUrl: `/tickets/${ticket.id}`,
          },
        )
        .catch(() => undefined);
    }

    return ticket;
  }

  findAll(filters: TicketListFilters = {}): Promise<TicketDocument[]> {
    const query: Record<string, unknown> = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.search) {
      const pattern = new RegExp(filters.search, 'i');
      query.$or = [{ subject: pattern }, { ticketNumber: pattern }];
    }

    return this.ticketModel
      .find(query)
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  findById(id: string): Promise<TicketDocument | null> {
    return this.ticketModel.findById(id).exec();
  }

  async findByIdOrThrow(id: string): Promise<TicketDocument> {
    const ticket = await this.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async assertAccess(
    ticket: TicketDocument,
    user: AuthUser,
  ): Promise<void> {
    if (user.role === Role.Admin) {
      return;
    }
    if (
      (user.role === Role.Customer || user.role === Role.Driver) &&
      String(ticket.userId) === user.sub
    ) {
      return;
    }
    throw new ForbiddenException('You do not have access to this ticket');
  }

  async update(
    id: string,
    patch: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string | null;
    },
  ): Promise<TicketDocument> {
    const ticket = await this.findByIdOrThrow(id);
    const update: Partial<Ticket> = {};

    if (patch.status !== undefined) {
      update.status = patch.status;
      if (patch.status === 'closed') {
        update.closedAt = new Date();
      } else if (ticket.closedAt) {
        update.closedAt = null;
      }
    }
    if (patch.priority !== undefined) {
      update.priority = patch.priority;
    }
    if (patch.assigneeId !== undefined) {
      update.assigneeId = patch.assigneeId;
    }

    const updated = await this.ticketModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Ticket not found');
    }

    if (
      patch.assigneeId !== undefined &&
      patch.assigneeId &&
      patch.assigneeId !== ticket.assigneeId
    ) {
      void this.notificationsService
        .notifyFromTemplate(
          'TICKET_ASSIGNED',
          [patch.assigneeId],
          { ticketNumber: updated.ticketNumber },
          {
            referenceType: 'ticket',
            referenceId: String(updated.id),
            actionUrl: `/tickets/${updated.id}`,
          },
        )
        .catch(() => undefined);
    }

    if (patch.status === 'closed' && ticket.status !== 'closed') {
      void this.notificationsService
        .notifyFromTemplate(
          'TICKET_CLOSED',
          [String(updated.userId)],
          { ticketNumber: updated.ticketNumber },
          {
            referenceType: 'ticket',
            referenceId: String(updated.id),
            actionUrl: `/tickets/${updated.id}`,
          },
        )
        .catch(() => undefined);
    }

    return updated;
  }

  async touchLastMessageAt(id: string, at = new Date()): Promise<TicketDocument> {
    const updated = await this.ticketModel
      .findByIdAndUpdate(id, { lastMessageAt: at }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Ticket not found');
    }
    return updated;
  }

  async applyMessageSideEffects(
    ticket: TicketDocument,
    senderRole: TicketMessageSenderRole,
  ): Promise<TicketDocument> {
    const patch: Partial<Ticket> = {};

    if (senderRole === 'admin') {
      if (ticket.status === 'pending' || ticket.status === 'open') {
        patch.status = 'in_progress';
      }
      if (!ticket.assigneeId) {
        // assignee set explicitly via PATCH; no auto-assign here
      }
    } else if (
      (senderRole === 'customer' || senderRole === 'driver') &&
      ticket.status === 'resolved'
    ) {
      patch.status = 'open';
    }

    if (!Object.keys(patch).length) {
      return ticket;
    }

    const updated = await this.ticketModel
      .findByIdAndUpdate(ticket.id, patch, { new: true })
      .exec();
    return updated ?? ticket;
  }
}

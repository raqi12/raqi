import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '../ticket.enums';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema(baseSchemaOptions)
export class Ticket {
  @Prop({ required: true, unique: true, index: true })
  ticketNumber: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    required: true,
    enum: TICKET_STATUSES,
    default: 'pending',
    index: true,
  })
  status: TicketStatus;

  @Prop({
    type: String,
    required: true,
    enum: TICKET_PRIORITIES,
    default: 'medium',
    index: true,
  })
  priority: TicketPriority;

  @Prop({ type: String, default: null })
  assigneeId: string | null;

  @Prop({ type: Date, default: null })
  closedAt: Date | null;

  @Prop({ type: Date, required: true, index: true })
  lastMessageAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

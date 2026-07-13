import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  TICKET_MESSAGE_SENDER_ROLES,
  type TicketMessageSenderRole,
} from '../ticket.enums';

export type TicketMessageDocument = HydratedDocument<TicketMessage>;

@Schema({
  ...baseSchemaOptions,
  timestamps: { createdAt: true, updatedAt: false },
})
export class TicketMessage {
  @Prop({ required: true, index: true })
  ticketId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({
    type: String,
    required: true,
    enum: TICKET_MESSAGE_SENDER_ROLES,
  })
  senderRole: TicketMessageSenderRole;

  @Prop({ required: true })
  body: string;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

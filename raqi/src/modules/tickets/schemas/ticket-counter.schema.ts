import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TicketCounterDocument = HydratedDocument<TicketCounter>;

@Schema({ collection: 'ticket_counters' })
export class TicketCounter {
  @Prop({ required: true, unique: true })
  dateKey: string;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const TicketCounterSchema = SchemaFactory.createForClass(TicketCounter);

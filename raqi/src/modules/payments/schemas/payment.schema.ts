import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema(baseSchemaOptions)
export class Payment {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: null })
  subscriptionId: string | null;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, required: true, enum: ['cash', 'online'] })
  method: 'cash' | 'online';

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'pending_gateway', 'paid', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'pending_gateway' | 'paid' | 'failed';
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

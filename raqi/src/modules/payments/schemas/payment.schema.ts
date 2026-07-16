import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema(baseSchemaOptions)
export class Payment {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: null, index: true })
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
    index: true,
  })
  status: 'pending' | 'pending_gateway' | 'paid' | 'failed';

  /** Linked wallet ledger entry once money is applied */
  @Prop({ type: String, default: null, index: true })
  walletTransactionId: string | null;

  @Prop({ type: String, default: null })
  recordedBy: string | null;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ customerId: 1, createdAt: -1 });

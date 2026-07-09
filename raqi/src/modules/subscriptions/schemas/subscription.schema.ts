import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type SubscriptionDocument = HydratedDocument<Subscription>;

export enum SubscriptionStatus {
  Draft = 'draft',
  Requested = 'requested',
  Active = 'active',
  Suspended = 'suspended',
  Expired = 'expired',
}

@Schema(baseSchemaOptions)
export class Subscription {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: null })
  planId: string | null;

  @Prop({ type: String, default: null })
  addressId: string | null;

  @Prop({ type: String, default: null })
  binId: string | null;

  @Prop({ type: String, default: null, index: true })
  areaId: string | null;

  @Prop({
    type: String,
    required: true,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.Draft,
    index: true,
  })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: ['unpaid', 'paid'], default: 'unpaid' })
  paymentStatus: 'unpaid' | 'paid';

  @Prop({ type: Date, default: null })
  renewedAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

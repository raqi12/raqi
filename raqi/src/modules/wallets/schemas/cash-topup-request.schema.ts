import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  CASH_TOPUP_STATUSES,
  type CashTopupStatus,
} from '../cash-topup.enums';

export type CashTopupRequestDocument = HydratedDocument<CashTopupRequest>;

@Schema(baseSchemaOptions)
export class CashTopupRequest {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, index: true })
  addressId: string;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true })
  addressLabel: string;

  @Prop({ type: String, default: '' })
  addressDetails: string;

  @Prop({ required: true })
  cityId: string;

  @Prop({ required: true })
  areaId: string;

  @Prop({ required: true, type: Number })
  lat: number;

  @Prop({ required: true, type: Number })
  lng: number;

  @Prop({
    type: String,
    required: true,
    enum: CASH_TOPUP_STATUSES,
    default: 'pending',
    index: true,
  })
  status: CashTopupStatus;

  @Prop({ type: String, default: null })
  courierName: string | null;

  @Prop({ type: String, default: null })
  courierPhone: string | null;

  @Prop({ type: Date, default: null })
  dispatchedAt: Date | null;

  @Prop({ type: Date, default: null })
  collectedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ type: String, default: null })
  reviewedBy: string | null;

  @Prop({ type: String, default: null })
  cancellationReason: string | null;

  @Prop({ type: String, default: null })
  walletTransactionId: string | null;
}

export const CashTopupRequestSchema =
  SchemaFactory.createForClass(CashTopupRequest);
CashTopupRequestSchema.index({ customerId: 1, createdAt: -1 });

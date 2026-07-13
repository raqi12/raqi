import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  WALLET_TRANSACTION_DIRECTIONS,
  WALLET_TRANSACTION_REFERENCE_TYPES,
  WALLET_TRANSACTION_TYPES,
} from '../wallet-transaction.types';

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@Schema(baseSchemaOptions)
export class WalletTransaction {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, enum: WALLET_TRANSACTION_TYPES })
  type: string;

  @Prop({ required: true, enum: WALLET_TRANSACTION_DIRECTIONS })
  direction: string;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true, min: 0 })
  balanceBefore: number;

  @Prop({ required: true, min: 0 })
  balanceAfter: number;

  @Prop({ type: String, enum: WALLET_TRANSACTION_REFERENCE_TYPES, default: null })
  referenceType: string | null;

  @Prop({ type: String, default: null })
  referenceId: string | null;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ type: String, default: null })
  createdBy: string | null;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
WalletTransactionSchema.index({ customerId: 1, createdAt: -1 });

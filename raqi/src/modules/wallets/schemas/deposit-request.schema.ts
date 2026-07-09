import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type DepositRequestDocument = HydratedDocument<DepositRequest>;

@Schema(baseSchemaOptions)
export class DepositRequest {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  evidenceImageUrl: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  })
  status: 'pending' | 'approved' | 'rejected';

  @Prop({ type: String, default: null })
  reviewedBy: string | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;
}

export const DepositRequestSchema = SchemaFactory.createForClass(DepositRequest);

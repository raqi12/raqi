import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type BinAssignmentDocument = HydratedDocument<BinAssignment>;

@Schema(baseSchemaOptions)
export class BinAssignment {
  @Prop({ type: String, required: true, index: true })
  binId: string;

  @Prop({ type: String, required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: null, index: true })
  subscriptionId: string | null;

  /** YYYY-MM-DD — delivery date equals subscription start when assigned via subscription */
  @Prop({ type: String, default: null })
  deliveryDate: string | null;

  @Prop({ default: true })
  active: boolean;
}

export const BinAssignmentSchema = SchemaFactory.createForClass(BinAssignment);
BinAssignmentSchema.index(
  { customerId: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);

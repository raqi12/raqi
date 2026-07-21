import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type BinDocument = HydratedDocument<Bin>;

@Schema(baseSchemaOptions)
export class Bin {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  capacity: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  fee: number;

  /** Total stock units for this bin type */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalCount: number;

  /** Units currently available to assign */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  availableCount: number;

  @Prop({ default: true })
  active: boolean;
}

export const BinSchema = SchemaFactory.createForClass(Bin);

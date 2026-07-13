import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type BinDocument = HydratedDocument<Bin>;

@Schema(baseSchemaOptions)
export class Bin {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  qr: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  capacity: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  fee: number;

  @Prop({
    type: String,
    required: true,
    enum: ['available', 'assigned', 'maintenance'],
    default: 'available',
  })
  status: 'available' | 'assigned' | 'maintenance';

  @Prop({ type: String, default: null, index: true })
  customerId: string | null;

  @Prop({ default: false })
  active: boolean;
}

export const BinSchema = SchemaFactory.createForClass(Bin);

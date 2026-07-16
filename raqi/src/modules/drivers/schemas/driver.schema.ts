import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type DriverDocument = HydratedDocument<Driver>;

@Schema(baseSchemaOptions)
export class Driver {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: String, unique: true, sparse: true, index: true })
  code: string | null;

  @Prop({ required: true })
  vehicleNumber: string;

  @Prop({ required: true, index: true })
  cityId: string;

  @Prop({ required: true, index: true })
  areaId: string;

  /** Admin-set rating 0–5 until a customer rating system exists. */
  @Prop({ type: Number, default: null, min: 0, max: 5 })
  rating: number | null;

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

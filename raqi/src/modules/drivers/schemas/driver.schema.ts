import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type DriverDocument = HydratedDocument<Driver>;

@Schema(baseSchemaOptions)
export class Driver {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  vehicleNumber: string;

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

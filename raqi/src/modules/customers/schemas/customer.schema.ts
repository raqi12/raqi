import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema(baseSchemaOptions)
export class Customer {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  cityId: string;

  @Prop({ required: true, index: true })
  areaId: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

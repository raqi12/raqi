import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  CUSTOMER_TYPES,
} from '../../../common/customer-type';
import { baseSchemaOptions } from '../../../database/schema.options';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema(baseSchemaOptions)
export class Customer {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: String,
    required: true,
    enum: CUSTOMER_TYPES,
    default: 'home',
  })
  type: (typeof CUSTOMER_TYPES)[number];
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

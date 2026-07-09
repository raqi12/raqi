import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type AddressDocument = HydratedDocument<Address>;

@Schema(baseSchemaOptions)
export class Address {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  area: string;

  @Prop({ required: true })
  details: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

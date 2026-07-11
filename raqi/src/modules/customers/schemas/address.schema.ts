import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type AddressDocument = HydratedDocument<Address>;

@Schema(baseSchemaOptions)
export class Address {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, index: true })
  cityId: string;

  @Prop({ required: true, index: true })
  areaId: string;

  @Prop({ required: true, default: false, index: true })
  isActive: boolean;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, default: '' })
  details: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
AddressSchema.index({ customerId: 1, isActive: 1 });

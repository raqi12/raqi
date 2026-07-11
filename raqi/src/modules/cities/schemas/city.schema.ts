import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type CityDocument = HydratedDocument<City>;

@Schema(baseSchemaOptions)
export class City {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

export const CitySchema = SchemaFactory.createForClass(City);

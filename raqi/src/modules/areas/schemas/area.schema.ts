import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type AreaDocument = HydratedDocument<Area>;

@Schema(baseSchemaOptions)
export class Area {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  city: string;
}

export const AreaSchema = SchemaFactory.createForClass(Area);

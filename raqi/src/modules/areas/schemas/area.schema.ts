import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type AreaDocument = HydratedDocument<Area>;

@Schema(baseSchemaOptions)
export class Area {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, index: true })
  cityId: string;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
AreaSchema.index({ cityId: 1, name: 1 }, { unique: true });

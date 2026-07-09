import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type RouteDocument = HydratedDocument<Route>;

@Schema(baseSchemaOptions)
export class Route {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  areaId: string;

  @Prop({ type: [String], default: [] })
  stops: string[];
}

export const RouteSchema = SchemaFactory.createForClass(Route);

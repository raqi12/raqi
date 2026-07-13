import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ACTIVITY_TYPES,
} from '../../../common/activity-type';
import { baseSchemaOptions } from '../../../database/schema.options';

export type PlanDocument = HydratedDocument<Plan>;

@Schema(baseSchemaOptions)
export class Plan {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    required: true,
    enum: ACTIVITY_TYPES,
    default: 'home',
  })
  activityType: (typeof ACTIVITY_TYPES)[number];

  @Prop({ required: true })
  price: number;

  @Prop({ type: String, required: true, enum: ['weekly', 'monthly', 'custom'] })
  frequency: 'weekly' | 'monthly' | 'custom';

  @Prop({ required: true })
  durationDays: number;

  @Prop({ required: true, min: 1 })
  numberOfCollections: number;

  @Prop({ default: true })
  active: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

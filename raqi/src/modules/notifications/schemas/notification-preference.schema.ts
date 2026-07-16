import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from '../notification.enums';

export type NotificationPreferenceDocument =
  HydratedDocument<NotificationPreference>;

@Schema({ _id: false })
export class CategoryPreference {
  @Prop({ type: String, enum: NOTIFICATION_CATEGORIES, required: true })
  category: NotificationCategory;

  @Prop({ default: true })
  inApp: boolean;

  @Prop({ default: true })
  push: boolean;

  @Prop({ default: false })
  email: boolean;
}

const CategoryPreferenceSchema =
  SchemaFactory.createForClass(CategoryPreference);

@Schema(baseSchemaOptions)
export class NotificationPreference {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: true })
  pushEnabled: boolean;

  @Prop({ default: false })
  emailEnabled: boolean;

  @Prop({ type: [CategoryPreferenceSchema], default: [] })
  categories: CategoryPreference[];
}

export const NotificationPreferenceSchema =
  SchemaFactory.createForClass(NotificationPreference);

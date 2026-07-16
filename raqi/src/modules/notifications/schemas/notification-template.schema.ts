import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  type NotificationCategory,
  type NotificationType,
} from '../notification.enums';

export type NotificationTemplateDocument =
  HydratedDocument<NotificationTemplate>;

@Schema(baseSchemaOptions)
export class NotificationTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  titleTemplate: string;

  @Prop({ required: true })
  bodyTemplate: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_TYPES,
    default: 'system',
  })
  type: NotificationType;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_CATEGORIES,
    default: 'general',
  })
  category: NotificationCategory;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_LOG_STATUSES,
  type NotificationChannel,
  type NotificationLogStatus,
} from '../notification.enums';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

@Schema(baseSchemaOptions)
export class NotificationLog {
  @Prop({ required: true, index: true })
  notificationId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_CHANNELS,
    default: 'in_app',
  })
  channel: NotificationChannel;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_LOG_STATUSES,
    default: 'pending',
    index: true,
  })
  status: NotificationLogStatus;

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null })
  openedAt: Date | null;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);
NotificationLogSchema.index({ notificationId: 1, channel: 1 });
NotificationLogSchema.index({ createdAt: -1, status: 1 });

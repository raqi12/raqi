import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/roles.enum';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TARGET_TYPES,
  NOTIFICATION_TYPES,
  SCHEDULED_NOTIFICATION_STATUSES,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationTargetType,
  type NotificationType,
  type ScheduledNotificationStatus,
} from '../notification.enums';

export type ScheduledNotificationDocument =
  HydratedDocument<ScheduledNotification>;

@Schema(baseSchemaOptions)
export class ScheduledNotification {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: String, default: null })
  image: string | null;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_TYPES,
    default: 'announcement',
  })
  type: NotificationType;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_CATEGORIES,
    default: 'general',
  })
  category: NotificationCategory;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_PRIORITIES,
    default: 'medium',
  })
  priority: NotificationPriority;

  @Prop({
    type: String,
    required: true,
    enum: NOTIFICATION_TARGET_TYPES,
    default: 'all',
  })
  targetType: NotificationTargetType;

  /** userId, role name, or null for all */
  @Prop({ type: String, default: null })
  targetId: string | null;

  @Prop({ type: [String], default: [] })
  userIds: string[];

  @Prop({ type: String, enum: Role, default: null })
  targetRole: Role | null;

  @Prop({ type: [String], enum: Role, default: [] })
  targetRoles: Role[];

  @Prop({ type: String, default: null })
  referenceType: string | null;

  @Prop({ type: String, default: null })
  referenceId: string | null;

  @Prop({ type: String, default: null })
  actionUrl: string | null;

  @Prop({ type: Date, required: true, index: true })
  scheduledAt: Date;

  @Prop({
    type: String,
    required: true,
    enum: SCHEDULED_NOTIFICATION_STATUSES,
    default: 'scheduled',
    index: true,
  })
  status: ScheduledNotificationStatus;

  @Prop({ required: true, index: true })
  createdBy: string;
}

export const ScheduledNotificationSchema =
  SchemaFactory.createForClass(ScheduledNotification);
ScheduledNotificationSchema.index({ status: 1, scheduledAt: 1 });

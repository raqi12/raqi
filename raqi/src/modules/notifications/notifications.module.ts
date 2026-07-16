import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { FirebasePushService } from './firebase-push.service';
import { NotificationScheduleCron } from './notification-schedule.cron';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import {
  DeviceToken,
  DeviceTokenSchema,
} from './schemas/device-token.schema';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema';
import {
  NotificationPreference,
  NotificationPreferenceSchema,
} from './schemas/notification-preference.schema';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from './schemas/notification-template.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  ScheduledNotification,
  ScheduledNotificationSchema,
} from './schemas/scheduled-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: ScheduledNotification.name, schema: ScheduledNotificationSchema },
      {
        name: NotificationPreference.name,
        schema: NotificationPreferenceSchema,
      },
    ]),
    UsersModule,
    JwtModule.register({}),
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsService,
    FirebasePushService,
    NotificationsGateway,
    NotificationScheduleCron,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

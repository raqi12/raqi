import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinsModule } from '../bins/bins.module';
import { CustomersModule } from '../customers/customers.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansModule } from '../plans/plans.module';
import { TasksModule } from '../tasks/tasks.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdditionalCollectionSettingsService } from './additional-collection-settings.service';
import {
  AdditionalCollectionSettings,
  AdditionalCollectionSettingsSchema,
} from './schemas/additional-collection-settings.schema';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { SubscriptionRenewalCron } from './subscription-renewal.cron';
import { SubscriptionRenewalService } from './subscription-renewal.service';
import {
  AdminAdditionalCollectionSettingsController,
  AdminSubscriptionsController,
  CustomerSubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      {
        name: AdditionalCollectionSettings.name,
        schema: AdditionalCollectionSettingsSchema,
      },
    ]),
    forwardRef(() => CustomersModule),
    forwardRef(() => TasksModule),
    PlansModule,
    BinsModule,
    WalletsModule,
    DriversModule,
    NotificationsModule,
  ],
  controllers: [
    AdminSubscriptionsController,
    AdminAdditionalCollectionSettingsController,
    CustomerSubscriptionsController,
  ],
  providers: [
    SubscriptionsService,
    SubscriptionRenewalService,
    SubscriptionRenewalCron,
    AdditionalCollectionSettingsService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionRenewalService,
    AdditionalCollectionSettingsService,
  ],
})
export class SubscriptionsModule {}

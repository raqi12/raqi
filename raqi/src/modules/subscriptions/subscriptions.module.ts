import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinsModule } from '../bins/bins.module';
import { CustomersModule } from '../customers/customers.module';
import { DriversModule } from '../drivers/drivers.module';
import { PlansModule } from '../plans/plans.module';
import { WalletsModule } from '../wallets/wallets.module';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { SubscriptionRenewalCron } from './subscription-renewal.cron';
import { SubscriptionRenewalService } from './subscription-renewal.service';
import {
  AdminSubscriptionsController,
  CustomerSubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    forwardRef(() => CustomersModule),
    PlansModule,
    BinsModule,
    WalletsModule,
    DriversModule,
  ],
  controllers: [
    AdminSubscriptionsController,
    CustomerSubscriptionsController,
  ],
  providers: [
    SubscriptionsService,
    SubscriptionRenewalService,
    SubscriptionRenewalCron,
  ],
  exports: [SubscriptionsService, SubscriptionRenewalService],
})
export class SubscriptionsModule {}

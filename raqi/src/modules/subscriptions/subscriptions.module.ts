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
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

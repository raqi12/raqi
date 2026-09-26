import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from '../plans/schemas/plan.schema';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscriptions/schemas/subscription.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallets/schemas/wallet-transaction.schema';
import { AdminFinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [AdminFinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

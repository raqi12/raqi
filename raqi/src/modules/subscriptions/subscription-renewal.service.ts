import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlansService } from '../plans/plans.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletTransactionsService } from '../wallets/wallet-transactions.service';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import { addDays, isSameUtcDay } from './subscription.utils';

export type RenewalOutcome = 'renewed' | 'grace' | 'suspended' | 'skipped';

export type RenewalRunSummary = {
  processed: number;
  renewed: number;
  grace: number;
  suspended: number;
  skipped: number;
};

@Injectable()
export class SubscriptionRenewalService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly plansService: PlansService,
    private readonly walletsService: WalletsService,
    private readonly walletTransactionsService: WalletTransactionsService,
  ) {}

  async processDueRenewals(): Promise<RenewalRunSummary> {
    const due = await this.subscriptionModel
      .find({
        status: SubscriptionStatus.Active,
        autoRenew: true,
        expiresAt: { $lte: new Date() },
      })
      .exec();

    const summary: RenewalRunSummary = {
      processed: due.length,
      renewed: 0,
      grace: 0,
      suspended: 0,
      skipped: 0,
    };

    for (const subscription of due) {
      const outcome = await this.renewSubscription(subscription);
      summary[outcome] += 1;
    }

    return summary;
  }

  async renewSubscription(
    subscription: SubscriptionDocument,
  ): Promise<RenewalOutcome> {
    if (
      !subscription.autoRenew ||
      subscription.status !== SubscriptionStatus.Active ||
      !subscription.expiresAt ||
      subscription.expiresAt > new Date()
    ) {
      return 'skipped';
    }

    if (
      subscription.renewedAt &&
      isSameUtcDay(subscription.renewedAt, new Date())
    ) {
      return 'skipped';
    }

    if (!subscription.planId) {
      return 'skipped';
    }

    const plan = await this.plansService.findById(String(subscription.planId));
    if (!plan || !plan.active) {
      return 'skipped';
    }

    try {
      const { transaction } = await this.walletsService.applyMovement({
        customerId: String(subscription.customerId),
        type: 'subscription_payment',
        direction: 'debit',
        amount: plan.price,
        referenceType: 'subscription',
        referenceId: String(subscription.id),
        description: `تجديد اشتراك تلقائي - ${plan.name}`,
      });

      subscription.expiresAt = addDays(subscription.expiresAt, plan.durationDays);
      subscription.renewedAt = new Date();
      subscription.renewalGraceUntil = null;
      subscription.paymentStatus = 'paid';
      subscription.status = SubscriptionStatus.Active;
      await subscription.save();

      await this.walletTransactionsService.updateReferenceId(
        String(transaction.id),
        String(subscription.id),
      );

      return 'renewed';
    } catch (error) {
      if (!this.isInsufficientBalanceError(error)) {
        throw error;
      }

      const now = new Date();
      if (!subscription.renewalGraceUntil) {
        subscription.renewalGraceUntil = addDays(subscription.expiresAt, 3);
        await subscription.save();
        return 'grace';
      }

      if (now >= subscription.renewalGraceUntil) {
        subscription.status = SubscriptionStatus.Suspended;
        await subscription.save();
        return 'suspended';
      }

      return 'grace';
    }
  }

  private isInsufficientBalanceError(error: unknown): boolean {
    return (
      error instanceof BadRequestException &&
      error.message === 'Insufficient wallet balance'
    );
  }
}

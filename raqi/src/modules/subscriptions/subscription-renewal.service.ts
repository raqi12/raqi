import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlansService } from '../plans/plans.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from '../tasks/tasks.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletTransactionsService } from '../wallets/wallet-transactions.service';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import { addDays, isSameUtcDay, shiftDateString } from './subscription.utils';

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
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
    private readonly customersService: CustomersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async notifyCustomer(
    customerId: string,
    code: string,
    subscriptionId: string,
  ) {
    const customer = await this.customersService.findById(customerId);
    if (!customer?.userId) return;
    void this.notificationsService
      .notifyFromTemplate(code, [String(customer.userId)], {}, {
        referenceType: 'subscription',
        referenceId: subscriptionId,
        actionUrl: `/subscriptions/${subscriptionId}`,
      })
      .catch(() => undefined);
  }

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

      const previousDates = subscription.collectionDates ?? [];
      const nextDates = previousDates.map((date) =>
        shiftDateString(date, plan.durationDays),
      );

      subscription.expiresAt = addDays(subscription.expiresAt, plan.durationDays);
      subscription.renewedAt = new Date();
      subscription.renewalGraceUntil = null;
      subscription.paymentStatus = 'paid';
      subscription.status = SubscriptionStatus.Active;
      subscription.collectionDates = nextDates;
      await subscription.save();

      await this.walletTransactionsService.updateReferenceId(
        String(transaction.id),
        String(subscription.id),
      );

      if (nextDates.length > 0 && subscription.areaId) {
        await this.tasksService.createForSubscription({
          subscriptionId: String(subscription.id),
          customerId: String(subscription.customerId),
          areaId: String(subscription.areaId),
          collectionDates: nextDates,
          driverId: subscription.driverId,
        });
      }

      await this.notifyCustomer(
        String(subscription.customerId),
        'SUBSCRIPTION_ACTIVATED',
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
        await this.notifyCustomer(
          String(subscription.customerId),
          'SUBSCRIPTION_SUSPENDED',
          String(subscription.id),
        );
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

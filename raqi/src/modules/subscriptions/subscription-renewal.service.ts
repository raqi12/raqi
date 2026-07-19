import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
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

  /**
   * Customer-initiated renewal: debit wallet, extend period, recreate tasks.
   * Allowed for active, suspended, or expired subscriptions.
   */
  async manualRenewForCustomer(
    subscriptionId: string,
    customerId: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findById(subscriptionId).exec();
    if (!subscription || String(subscription.customerId) !== customerId) {
      throw new NotFoundException('Subscription not found');
    }

    const renewableStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.Active,
      SubscriptionStatus.Suspended,
      SubscriptionStatus.Expired,
    ];
    if (!renewableStatuses.includes(subscription.status)) {
      throw new BadRequestException(
        'Subscription cannot be renewed in its current status',
      );
    }

    if (!subscription.planId) {
      throw new BadRequestException('Subscription has no plan');
    }

    const plan = await this.plansService.findById(String(subscription.planId));
    if (!plan || !plan.active) {
      throw new BadRequestException('Plan is not available');
    }

    if (
      subscription.renewedAt &&
      isSameUtcDay(subscription.renewedAt, new Date())
    ) {
      throw new BadRequestException('Subscription was already renewed today');
    }

    const { transaction } = await this.walletsService.applyMovement({
      customerId: String(subscription.customerId),
      type: 'subscription_payment',
      direction: 'debit',
      amount: plan.price,
      referenceType: 'subscription',
      referenceId: String(subscription.id),
      description: `تجديد اشتراك - ${plan.name}`,
    });

    const previousDates = subscription.collectionDates ?? [];
    const baseExpiry =
      subscription.expiresAt && subscription.expiresAt > new Date()
        ? subscription.expiresAt
        : new Date();
    const nextDates =
      previousDates.length > 0
        ? previousDates.map((date) => shiftDateString(date, plan.durationDays))
        : [];

    subscription.expiresAt = addDays(baseExpiry, plan.durationDays);
    subscription.renewedAt = new Date();
    subscription.renewalGraceUntil = null;
    subscription.paymentStatus = 'paid';
    subscription.status = SubscriptionStatus.Active;
    if (nextDates.length > 0) {
      subscription.collectionDates = nextDates;
    }
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

    return subscription;
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
    if (!(error instanceof BadRequestException)) {
      return false;
    }
    const response = error.getResponse();
    const message =
      typeof response === 'string'
        ? response
        : typeof response === 'object' &&
            response !== null &&
            'message' in response
          ? String((response as { message: unknown }).message)
          : error.message;
    return (
      message === 'Insufficient wallet balance' ||
      message === 'رصيد المحفظة غير كافٍ'
    );
  }
}

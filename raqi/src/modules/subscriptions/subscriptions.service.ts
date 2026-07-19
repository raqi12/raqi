import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BinsService } from '../bins/bins.service';
import { CustomersService } from '../customers/customers.service';
import { DriversService } from '../drivers/drivers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlansService } from '../plans/plans.service';
import { TasksService } from '../tasks/tasks.service';
import { WalletsService } from '../wallets/wallets.service';
import { WalletTransactionsService } from '../wallets/wallet-transactions.service';
import { SubscribePlanDto } from './dto/subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import {
  addDays,
  normalizeCollectionDates,
  parseUtcDateString,
  toUtcDateString,
} from './subscription.utils';
import { AdditionalCollectionSettingsService } from './additional-collection-settings.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly plansService: PlansService,
    private readonly binsService: BinsService,
    private readonly walletsService: WalletsService,
    private readonly walletTransactionsService: WalletTransactionsService,
    private readonly customersService: CustomersService,
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
    private readonly notificationsService: NotificationsService,
    private readonly additionalCollectionSettingsService: AdditionalCollectionSettingsService,
  ) {}

  private async notifyCustomer(
    customerId: string,
    code: string,
    variables: Record<string, string> = {},
    extras?: { referenceId?: string; actionUrl?: string },
  ) {
    const customer = await this.customersService.findById(customerId);
    if (!customer?.userId) return;
    void this.notificationsService
      .notifyFromTemplate(code, [String(customer.userId)], variables, {
        referenceType: 'subscription',
        referenceId: extras?.referenceId ?? null,
        actionUrl: extras?.actionUrl ?? null,
      })
      .catch(() => undefined);
  }

  private async resolveAddressLocation(
    customerId: string,
    addressId: string,
  ): Promise<{ cityId: string; areaId: string }> {
    const address = await this.customersService.findAddressById(addressId);
    if (!address || String(address.customerId) !== customerId) {
      throw new BadRequestException('Address not found for this customer');
    }
    if (!address.cityId || !address.areaId) {
      throw new BadRequestException('Address must have city and area');
    }
    return { cityId: address.cityId, areaId: address.areaId };
  }

  async create(
    input: Partial<Subscription> & { customerId: string; addressId: string },
    status: SubscriptionStatus,
  ): Promise<SubscriptionDocument> {
    const { cityId, areaId } = await this.resolveAddressLocation(
      input.customerId,
      input.addressId,
    );
    const { areaId: _ignoredAreaId, ...rest } = input;
    return this.subscriptionModel.create({
      ...rest,
      cityId,
      areaId,
      status,
    });
  }

  findAll(): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find().exec();
  }

  findByCustomer(customerId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  findById(id: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findById(id).exec();
  }

  async markPaymentPaid(subscriptionId: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findById(subscriptionId).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.paymentStatus = 'paid';
    return subscription.save();
  }

  findCurrentForCustomer(
    customerId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({
        customerId,
        status: {
          $in: [
            SubscriptionStatus.Active,
            SubscriptionStatus.Requested,
            SubscriptionStatus.Draft,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  findActiveForCustomer(
    customerId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ customerId, status: SubscriptionStatus.Active })
      .exec();
  }

  private async ensureExpiresAt(
    subscription: SubscriptionDocument,
  ): Promise<SubscriptionDocument> {
    if (
      subscription.status !== SubscriptionStatus.Active ||
      !subscription.planId ||
      subscription.expiresAt
    ) {
      return subscription;
    }
    const plan = await this.plansService.findById(String(subscription.planId));
    if (!plan) {
      return subscription;
    }
    const baseDate =
      subscription.renewedAt ??
      (subscription as SubscriptionDocument & { createdAt?: Date }).createdAt ??
      new Date();
    subscription.expiresAt = addDays(baseDate, plan.durationDays);
    return subscription.save();
  }

  findEndedForCustomer(
    customerId: string,
  ): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({
        customerId,
        status: {
          $in: [SubscriptionStatus.Expired, SubscriptionStatus.Suspended],
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async withPlanSummary(subscription: SubscriptionDocument) {
    const result = subscription.toJSON();
    if (!subscription.planId) {
      return result;
    }
    const plan = await this.plansService.findById(String(subscription.planId));
    if (!plan) {
      return result;
    }
    return {
      ...result,
      plan: {
        id: String(plan.id),
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        frequency: plan.frequency,
      },
    };
  }

  async getCurrentWithPlan(customerId: string) {
    const subscription = await this.findCurrentForCustomer(customerId);
    if (!subscription) {
      return null;
    }
    await this.ensureExpiresAt(subscription);
    return this.withPlanSummary(subscription);
  }

  async getPreviousWithPlan(customerId: string) {
    const subscriptions = await this.findEndedForCustomer(customerId);
    return Promise.all(
      subscriptions.map((subscription) => this.withPlanSummary(subscription)),
    );
  }

  async setAutoRenew(
    customerId: string,
    autoRenew: boolean,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.findActiveForCustomer(customerId);
    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }
    subscription.autoRenew = autoRenew;
    return subscription.save();
  }

  async suspendActiveForCustomer(customerId: string): Promise<void> {
    const subscription = await this.findActiveForCustomer(customerId);
    if (!subscription) {
      return;
    }
    await this.setStatus(String(subscription.id), SubscriptionStatus.Suspended, {
      autoRenew: false,
    });
  }

  findForGeneration(
    areaId: string,
    scheduledDate: string,
  ): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({
        areaId,
        status: { $in: [SubscriptionStatus.Active, SubscriptionStatus.Requested] },
        collectionDates: scheduledDate,
      })
      .exec();
  }

  countActive(): Promise<number> {
    return this.subscriptionModel
      .countDocuments({ status: SubscriptionStatus.Active })
      .exec();
  }

  async activate(id: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }
    const hasAddress = Boolean(subscription.addressId);
    const hasLocation = Boolean(subscription.cityId && subscription.areaId);
    const hasPlan = Boolean(subscription.planId);
    const hasPayment = subscription.paymentStatus === 'paid';
    if (!hasAddress || !hasLocation || !hasPlan || !hasPayment) {
      throw new BadRequestException(
        'Activation requires address, location, plan, and paid status',
      );
    }
    subscription.status = SubscriptionStatus.Active;
    if (!subscription.expiresAt && subscription.planId) {
      const plan = await this.plansService.findById(String(subscription.planId));
      if (plan) {
        subscription.expiresAt = addDays(new Date(), plan.durationDays);
      }
    }
    const saved = await subscription.save();
    await this.notifyCustomer(
      String(saved.customerId),
      'SUBSCRIPTION_ACTIVATED',
      {},
      {
        referenceId: String(saved.id),
        actionUrl: `/subscriptions/${saved.id}`,
      },
    );
    return saved;
  }

  async setStatus(
    id: string,
    status: SubscriptionStatus,
    extra: Partial<Subscription> = {},
  ): Promise<SubscriptionDocument | null> {
    const updated = await this.subscriptionModel
      .findByIdAndUpdate(id, { status, ...extra }, { new: true })
      .exec();
    if (updated && status === SubscriptionStatus.Suspended) {
      await this.notifyCustomer(
        String(updated.customerId),
        'SUBSCRIPTION_SUSPENDED',
        {},
        {
          referenceId: String(updated.id),
          actionUrl: `/subscriptions/${updated.id}`,
        },
      );
    }
    return updated;
  }

  async update(
    id: string,
    input: {
      planId?: string;
      binId?: string;
      addressId?: string;
      paymentStatus?: 'paid' | 'unpaid';
    },
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }
    if (
      subscription.status !== SubscriptionStatus.Draft &&
      subscription.status !== SubscriptionStatus.Requested
    ) {
      throw new BadRequestException(
        'Only draft or requested subscriptions can be updated',
      );
    }

    if (input.addressId && input.addressId !== String(subscription.addressId)) {
      const { cityId, areaId } = await this.resolveAddressLocation(
        String(subscription.customerId),
        input.addressId,
      );
      subscription.addressId = input.addressId;
      subscription.cityId = cityId;
      subscription.areaId = areaId;
      subscription.driverId = null;
    }

    if (input.planId) {
      const plan = await this.plansService.findById(input.planId);
      if (!plan || !plan.active) {
        throw new BadRequestException('Plan is not available');
      }
      subscription.planId = input.planId;
    }

    if (input.binId) {
      const bin = await this.binsService.findById(input.binId);
      if (!bin) {
        throw new BadRequestException('Bin not found');
      }
      const isCurrentBin = String(subscription.binId) === input.binId;
      const isAvailable = bin.status === 'available';
      const isOwnedByCustomer =
        bin.customerId &&
        String(bin.customerId) === String(subscription.customerId);
      if (!isCurrentBin && !isAvailable && !isOwnedByCustomer) {
        throw new BadRequestException('Bin is not available');
      }
      subscription.binId = input.binId;
    }

    if (input.paymentStatus) {
      subscription.paymentStatus = input.paymentStatus;
    }

    return subscription.save();
  }

  async assignDriver(
    subscriptionId: string,
    driverId: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findById(subscriptionId).exec();
    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }
    if (!subscription.cityId || !subscription.areaId) {
      throw new BadRequestException(
        'Subscription must have city and area from address before assigning a driver',
      );
    }

    const driver = await this.driversService.findById(driverId);
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    if (driver.status !== 'active') {
      throw new BadRequestException('Driver is not active');
    }
    if (
      driver.cityId !== subscription.cityId ||
      driver.areaId !== subscription.areaId
    ) {
      throw new BadRequestException(
        'Driver must serve the same city and area as the subscription address',
      );
    }

    subscription.driverId = driverId;
    await subscription.save();

    await this.tasksService.ensureAssignedToDriver({
      subscriptionId: String(subscription.id),
      customerId: String(subscription.customerId),
      areaId: String(subscription.areaId),
      collectionDates: subscription.collectionDates ?? [],
      driverId,
    });

    await this.notifyCustomer(
      String(subscription.customerId),
      'DRIVER_ASSIGNED',
      {},
      {
        referenceId: String(subscription.id),
        actionUrl: `/subscriptions/${subscription.id}`,
      },
    );

    if (driver.userId) {
      void this.notificationsService
        .notifyFromTemplate(
          'DRIVER_ASSIGNED',
          [String(driver.userId)],
          {},
          {
            referenceType: 'subscription',
            referenceId: String(subscription.id),
            actionUrl: `/subscriptions/${subscription.id}`,
          },
        )
        .catch(() => undefined);
    }

    return subscription;
  }

  async subscribeWithWallet(
    customerId: string,
    input: SubscribePlanDto,
  ): Promise<SubscriptionDocument> {
    return this.assignPlan(customerId, input, { deductWallet: true });
  }

  /**
   * Ends an active/requested subscription when the customer changes plan:
   * cancel open tasks and mark subscription expired as of now.
   */
  private async endSubscriptionForReplace(
    subscription: SubscriptionDocument,
  ): Promise<void> {
    await this.tasksService.cancelOpenForSubscription(String(subscription.id));
    subscription.status = SubscriptionStatus.Expired;
    subscription.autoRenew = false;
    subscription.expiresAt = new Date();
    await subscription.save();
  }

  async assignPlan(
    customerId: string,
    input: SubscribePlanDto,
    options: { deductWallet?: boolean } = {},
  ): Promise<SubscriptionDocument> {
    const deductWallet = options.deductWallet ?? false;

    const existing = await this.findCurrentForCustomer(customerId);
    const replacing = Boolean(
      existing &&
        (existing.status === SubscriptionStatus.Active ||
          existing.status === SubscriptionStatus.Requested),
    );
    const oldBinId =
      replacing && existing?.binId ? String(existing.binId) : null;
    const requestedBinId = input.binId ? String(input.binId) : null;
    const resolvedBinId = requestedBinId ?? oldBinId;
    const reusingBin = Boolean(
      resolvedBinId && oldBinId && resolvedBinId === oldBinId,
    );

    const plan = await this.plansService.findById(input.planId);
    if (!plan || !plan.active) {
      throw new BadRequestException('Plan is not available');
    }

    if (requestedBinId && !reusingBin) {
      const bin = await this.binsService.findById(requestedBinId);
      if (!bin || bin.status !== 'available') {
        throw new BadRequestException('Bin is not available');
      }
    }

    // Reusing an existing bin does not charge bin fee again.
    const cost = await this.plansService.calculateCost(
      input.planId,
      reusingBin ? undefined : requestedBinId ?? undefined,
    );

    const { cityId, areaId } = await this.resolveAddressLocation(
      customerId,
      input.addressId,
    );

    const now = new Date();
    const expiresAt = addDays(now, plan.durationDays);
    const collectionDates = normalizeCollectionDates(
      input.collectionDates,
      plan.numberOfCollections,
      now,
      expiresAt,
    );
    const deliveryDate = toUtcDateString(now);

    if (deductWallet) {
      const wallet = await this.walletsService.ensureWallet(customerId);
      if (wallet.balance < cost.total) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    if (replacing && existing) {
      await this.endSubscriptionForReplace(existing);
    }

    let debited = false;
    let debitTransactionId: string | null = null;
    let previousBinUnassigned: string | null = null;
    const paymentDescription =
      cost.binFee > 0
        ? `دفع اشتراك - ${plan.name} + رسوم حاوية (${cost.binFee} د.ل)`
        : replacing
          ? `تغيير خطة - ${plan.name}`
          : `دفع اشتراك - ${plan.name}`;
    try {
      if (deductWallet) {
        const { transaction } = await this.walletsService.applyMovement({
          customerId,
          type: 'subscription_payment',
          direction: 'debit',
          amount: cost.total,
          referenceType: 'subscription',
          description: paymentDescription,
        });
        debited = true;
        debitTransactionId = String(transaction.id);
      }

      if (resolvedBinId) {
        if (reusingBin) {
          await this.binsService.assign(resolvedBinId, customerId, true, {
            deliveryDate,
          });
        } else {
          if (oldBinId) {
            await this.binsService.unassign(oldBinId);
            previousBinUnassigned = oldBinId;
          }
          await this.binsService.assign(resolvedBinId, customerId, true, {
            deliveryDate,
          });
        }
      }

      const subscription = await this.subscriptionModel.create({
        customerId,
        planId: input.planId,
        binId: resolvedBinId,
        addressId: input.addressId,
        cityId,
        areaId,
        collectionDates,
        status: SubscriptionStatus.Active,
        paymentStatus: 'paid',
        autoRenew: false,
        expiresAt,
      });

      if (debitTransactionId) {
        await this.walletTransactionsService.updateReferenceId(
          debitTransactionId,
          String(subscription.id),
        );
      }

      await this.tasksService.createForSubscription({
        subscriptionId: String(subscription.id),
        customerId,
        areaId,
        collectionDates,
        driverId: null,
      });

      return subscription;
    } catch (error) {
      if (previousBinUnassigned) {
        await this.binsService
          .assign(previousBinUnassigned, customerId, true, {
            deliveryDate,
          })
          .catch(() => undefined);
      }
      if (debited) {
        await this.walletsService.applyMovement({
          customerId,
          type: 'refund',
          direction: 'credit',
          amount: cost.total,
          referenceType: 'subscription',
          description: replacing
            ? `استرداد - فشل تغيير الخطة (${plan.name})`
            : `استرداد - فشل تفعيل الاشتراك (${plan.name})`,
        });
      }
      throw error;
    }
  }

  async getAdditionalCollectionPrice(): Promise<{
    price: number;
    active: boolean;
    currency: string;
  }> {
    const settings =
      await this.additionalCollectionSettingsService.getOrEmpty();
    return {
      price: settings?.price ?? 0,
      active: settings?.active ?? false,
      currency: 'LYD',
    };
  }

  async requestAdditionalCollection(
    customerId: string,
    collectionDate: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.findActiveForCustomer(customerId);
    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }
    if (!subscription.expiresAt) {
      throw new BadRequestException('Subscription period end date is missing');
    }
    if (!subscription.areaId) {
      throw new BadRequestException('Subscription area is missing');
    }

    const settings =
      await this.additionalCollectionSettingsService.getActive();
    if (!settings || settings.price < 0) {
      throw new BadRequestException(
        'Additional collection is not available right now',
      );
    }
    if (settings.price <= 0) {
      throw new BadRequestException(
        'Additional collection price is not configured',
      );
    }

    const dateStr = collectionDate.slice(0, 10);
    parseUtcDateString(dateStr);

    const todayStr = toUtcDateString(new Date());
    const createdAtValue = (subscription as SubscriptionDocument & { createdAt?: Date })
      .createdAt;
    const startStr = toUtcDateString(
      createdAtValue ? new Date(createdAtValue) : new Date(),
    );
    const endStr = toUtcDateString(new Date(subscription.expiresAt));
    const earliestAllowed = startStr > todayStr ? startStr : todayStr;

    if (dateStr < earliestAllowed) {
      throw new BadRequestException(
        `Collection date ${dateStr} must be on or after ${earliestAllowed}`,
      );
    }
    if (dateStr > endStr) {
      throw new BadRequestException(
        `Collection date ${dateStr} is after the subscription end (${endStr})`,
      );
    }

    const existingDates = subscription.collectionDates ?? [];
    if (existingDates.includes(dateStr)) {
      throw new BadRequestException(
        `Collection date ${dateStr} is already scheduled`,
      );
    }

    const wallet = await this.walletsService.ensureWallet(customerId);
    if (wallet.balance < settings.price) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    let debited = false;
    let dateAdded = false;
    try {
      await this.walletsService.applyMovement({
        customerId,
        type: 'additional_collection_payment',
        direction: 'debit',
        amount: settings.price,
        referenceType: 'subscription',
        referenceId: String(subscription.id),
        description: `جمع إضافي - ${dateStr}`,
      });
      debited = true;

      const nextDates = [...existingDates, dateStr].sort();
      subscription.collectionDates = nextDates;
      await subscription.save();
      dateAdded = true;

      await this.tasksService.createForSubscription({
        subscriptionId: String(subscription.id),
        customerId,
        areaId: subscription.areaId,
        collectionDates: [dateStr],
        driverId: subscription.driverId,
      });

      return subscription;
    } catch (error) {
      if (dateAdded) {
        subscription.collectionDates = existingDates;
        await subscription.save().catch(() => undefined);
      }
      if (debited) {
        await this.walletsService.applyMovement({
          customerId,
          type: 'refund',
          direction: 'credit',
          amount: settings.price,
          referenceType: 'subscription',
          referenceId: String(subscription.id),
          description: `استرداد - فشل إضافة جمع إضافي (${dateStr})`,
        });
      }
      throw error;
    }
  }

  async replaceBin(
    subscriptionId: string,
    newBinId: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    if (subscription.status !== SubscriptionStatus.Active) {
      throw new BadRequestException(
        'Only active subscriptions can replace a bin',
      );
    }

    const newBin = await this.binsService.findById(newBinId);
    if (!newBin || newBin.status !== 'available') {
      throw new BadRequestException('Bin is not available');
    }

    if (subscription.binId && String(subscription.binId) === newBinId) {
      throw new BadRequestException('Bin is already assigned to this subscription');
    }

    const createdAtValue = (
      subscription as SubscriptionDocument & { createdAt?: Date }
    ).createdAt;
    const startDate = toUtcDateString(
      createdAtValue ? new Date(createdAtValue) : new Date(),
    );

    const oldBinId = subscription.binId ? String(subscription.binId) : null;

    if (oldBinId) {
      await this.binsService.unassign(oldBinId);
    }

    try {
      await this.binsService.assign(
        newBinId,
        subscription.customerId,
        true,
        { deliveryDate: startDate },
      );
      subscription.binId = newBinId;
      return subscription.save();
    } catch (error) {
      if (oldBinId) {
        await this.binsService
          .assign(oldBinId, subscription.customerId, true, {
            deliveryDate: startDate,
          })
          .catch(() => undefined);
      }
      throw error;
    }
  }

  async replaceBinForCustomer(
    customerId: string,
    newBinId: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.findActiveForCustomer(customerId);
    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }
    return this.replaceBin(String(subscription.id), newBinId);
  }
}

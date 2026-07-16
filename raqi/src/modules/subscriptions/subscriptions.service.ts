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
} from './subscription.utils';

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
  ) {}

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

  async getCurrentWithPlan(customerId: string) {
    const subscription = await this.findCurrentForCustomer(customerId);
    if (!subscription) {
      return null;
    }
    await this.ensureExpiresAt(subscription);
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
    return subscription.save();
  }

  setStatus(
    id: string,
    status: SubscriptionStatus,
    extra: Partial<Subscription> = {},
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findByIdAndUpdate(id, { status, ...extra }, { new: true })
      .exec();
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

    return subscription;
  }

  async subscribeWithWallet(
    customerId: string,
    input: SubscribePlanDto,
  ): Promise<SubscriptionDocument> {
    return this.assignPlan(customerId, input, { deductWallet: true });
  }

  async assignPlan(
    customerId: string,
    input: SubscribePlanDto,
    options: { deductWallet?: boolean } = {},
  ): Promise<SubscriptionDocument> {
    const deductWallet = options.deductWallet ?? false;

    const existing = await this.findCurrentForCustomer(customerId);
    if (
      existing &&
      (existing.status === SubscriptionStatus.Active ||
        existing.status === SubscriptionStatus.Requested)
    ) {
      throw new BadRequestException(
        'Customer already has an active or pending subscription',
      );
    }

    const plan = await this.plansService.findById(input.planId);
    if (!plan || !plan.active) {
      throw new BadRequestException('Plan is not available');
    }

    if (input.binId) {
      const bin = await this.binsService.findById(input.binId);
      if (!bin || bin.status !== 'available') {
        throw new BadRequestException('Bin is not available');
      }
    }

    const cost = await this.plansService.calculateCost(input.planId, input.binId);

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

    if (deductWallet) {
      const wallet = await this.walletsService.ensureWallet(customerId);
      if (wallet.balance < cost.total) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    let debited = false;
    let debitTransactionId: string | null = null;
    const paymentDescription =
      cost.binFee > 0
        ? `دفع اشتراك - ${plan.name} + رسوم حاوية (${cost.binFee} د.ل)`
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

      const subscription = await this.subscriptionModel.create({
        customerId,
        planId: input.planId,
        binId: input.binId ?? null,
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

      if (input.binId) {
        await this.binsService.assign(input.binId, customerId, true);
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
      if (debited) {
        await this.walletsService.applyMovement({
          customerId,
          type: 'refund',
          direction: 'credit',
          amount: cost.total,
          referenceType: 'subscription',
          description: `استرداد - فشل تفعيل الاشتراك (${plan.name})`,
        });
      }
      throw error;
    }
  }
}

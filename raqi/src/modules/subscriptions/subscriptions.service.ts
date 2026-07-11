import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BinsService } from '../bins/bins.service';
import { CustomersService } from '../customers/customers.service';
import { DriversService } from '../drivers/drivers.service';
import { PlansService } from '../plans/plans.service';
import { WalletsService } from '../wallets/wallets.service';
import { SubscribePlanDto } from './dto/subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly plansService: PlansService,
    private readonly binsService: BinsService,
    private readonly walletsService: WalletsService,
    private readonly customersService: CustomersService,
    private readonly driversService: DriversService,
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

  findForGeneration(areaId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({
        areaId,
        status: { $in: [SubscriptionStatus.Active, SubscriptionStatus.Requested] },
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
    const hasBin = Boolean(subscription.binId);
    if (!hasAddress || !hasLocation || !hasPlan || !hasPayment || !hasBin) {
      throw new BadRequestException(
        'Activation requires address, location, plan, paid status, and assigned bin',
      );
    }
    subscription.status = SubscriptionStatus.Active;
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
    return subscription.save();
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

    const bin = await this.binsService.findById(input.binId);
    if (!bin || bin.status !== 'available') {
      throw new BadRequestException('Bin is not available');
    }

    const { cityId, areaId } = await this.resolveAddressLocation(
      customerId,
      input.addressId,
    );

    if (deductWallet) {
      const wallet = await this.walletsService.ensureWallet(customerId);
      if (wallet.balance < plan.price) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      await this.walletsService.debit(customerId, plan.price);
    }

    try {
      const subscription = await this.subscriptionModel.create({
        customerId,
        planId: input.planId,
        binId: input.binId,
        addressId: input.addressId,
        cityId,
        areaId,
        status: SubscriptionStatus.Active,
        paymentStatus: 'paid',
      });

      await this.binsService.assign(input.binId, customerId, true);

      return subscription;
    } catch (error) {
      if (deductWallet) {
        await this.walletsService.credit(customerId, plan.price);
      }
      throw error;
    }
  }
}

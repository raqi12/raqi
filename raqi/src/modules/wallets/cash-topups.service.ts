import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../../common/roles.enum';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import type { CashTopupStatus } from './cash-topup.enums';
import {
  CashTopupRequest,
  CashTopupRequestDocument,
} from './schemas/cash-topup-request.schema';
import { WalletsService } from './wallets.service';

@Injectable()
export class CashTopupsService {
  constructor(
    @InjectModel(CashTopupRequest.name)
    private readonly cashTopupModel: Model<CashTopupRequestDocument>,
    private readonly customersService: CustomersService,
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(input: {
    customerId: string;
    amount: number;
    addressId: string;
  }): Promise<CashTopupRequestDocument> {
    const address = await this.customersService.findAddressById(input.addressId);
    if (!address || String(address.customerId) !== input.customerId) {
      throw new BadRequestException('Address not found for this customer');
    }

    await this.walletsService.ensureWallet(input.customerId);

    const request = await this.cashTopupModel.create({
      customerId: input.customerId,
      addressId: String(address.id),
      amount: input.amount,
      addressLabel: address.label,
      addressDetails: address.details ?? '',
      cityId: address.cityId,
      areaId: address.areaId,
      lat: address.lat,
      lng: address.lng,
      status: 'pending',
      courierName: null,
      courierPhone: null,
    });

    void this.notifyAdminsCreated(request).catch(() => undefined);
    return request;
  }

  findAll(status?: CashTopupStatus): Promise<CashTopupRequestDocument[]> {
    const filter = status ? { status } : {};
    return this.cashTopupModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  findByCustomer(customerId: string): Promise<CashTopupRequestDocument[]> {
    return this.cashTopupModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  findById(id: string): Promise<CashTopupRequestDocument | null> {
    return this.cashTopupModel.findById(id).exec();
  }

  async findByIdOrThrow(id: string): Promise<CashTopupRequestDocument> {
    const request = await this.findById(id);
    if (!request) {
      throw new NotFoundException('Cash top-up request not found');
    }
    return request;
  }

  async assignCourier(
    id: string,
    input: { courierName: string; courierPhone: string },
  ): Promise<CashTopupRequestDocument> {
    const request = await this.findByIdOrThrow(id);
    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new BadRequestException('Cannot assign courier to a closed request');
    }
    if (request.status !== 'pending' && request.status !== 'dispatched') {
      throw new BadRequestException(
        'Courier can only be assigned while pending or dispatched',
      );
    }

    request.courierName = input.courierName.trim();
    request.courierPhone = input.courierPhone.trim();
    if (!request.courierName || !request.courierPhone) {
      throw new BadRequestException('Courier name and phone are required');
    }
    await request.save();
    return request;
  }

  async dispatch(id: string): Promise<CashTopupRequestDocument> {
    const request = await this.findByIdOrThrow(id);
    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be dispatched');
    }
    if (!request.courierName || !request.courierPhone) {
      throw new BadRequestException('Assign a courier before dispatching');
    }

    request.status = 'dispatched';
    request.dispatchedAt = new Date();
    await request.save();

    void this.notifyCustomer(request, 'CASH_TOPUP_DISPATCHED', {
      amount: String(request.amount),
      courierName: request.courierName,
    }).catch(() => undefined);

    return request;
  }

  async collect(id: string): Promise<CashTopupRequestDocument> {
    const request = await this.findByIdOrThrow(id);
    if (request.status !== 'dispatched') {
      throw new BadRequestException('Only dispatched requests can be collected');
    }

    request.status = 'collected';
    request.collectedAt = new Date();
    await request.save();
    return request;
  }

  async confirm(
    id: string,
    adminUserId: string,
  ): Promise<CashTopupRequestDocument> {
    const request = await this.findByIdOrThrow(id);
    if (request.status !== 'collected') {
      throw new BadRequestException(
        'Only collected requests can be confirmed and credited',
      );
    }
    if (request.walletTransactionId) {
      throw new BadRequestException('Request already credited');
    }

    await this.walletsService.ensureWallet(request.customerId);
    const { transaction } = await this.walletsService.applyMovement({
      customerId: request.customerId,
      type: 'deposit',
      direction: 'credit',
      amount: request.amount,
      referenceType: 'cash_topup',
      referenceId: String(request.id),
      description: 'شحن محفظة نقداً عبر مندوب',
      createdBy: adminUserId,
    });

    request.status = 'completed';
    request.completedAt = new Date();
    request.reviewedBy = adminUserId;
    request.walletTransactionId = String(transaction.id);
    await request.save();

    void this.notifyCustomer(request, 'CASH_TOPUP_COMPLETED', {
      amount: String(request.amount),
    }).catch(() => undefined);

    return request;
  }

  async cancel(
    id: string,
    options: {
      actorUserId?: string;
      reason?: string;
      allowCustomerPendingOnly?: boolean;
      customerId?: string;
    },
  ): Promise<CashTopupRequestDocument> {
    const request = await this.findByIdOrThrow(id);

    if (options.customerId && String(request.customerId) !== options.customerId) {
      throw new NotFoundException('Cash top-up request not found');
    }

    if (request.status === 'completed') {
      throw new BadRequestException('Completed requests cannot be cancelled');
    }
    if (request.status === 'cancelled') {
      throw new BadRequestException('Request is already cancelled');
    }

    if (options.allowCustomerPendingOnly && request.status !== 'pending') {
      throw new BadRequestException('Customers can only cancel pending requests');
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.reviewedBy = options.actorUserId ?? request.reviewedBy;
    request.cancellationReason = options.reason?.trim() || null;
    await request.save();

    void this.notifyCustomer(request, 'CASH_TOPUP_CANCELLED', {
      amount: String(request.amount),
      reason: request.cancellationReason ?? '',
    }).catch(() => undefined);

    return request;
  }

  private async notifyAdminsCreated(request: CashTopupRequestDocument) {
    const admins = await this.usersService.findByRole(Role.Admin);
    const adminIds = admins.map((admin) => String(admin.id));
    if (!adminIds.length) return;

    await this.notificationsService.notifyFromTemplate(
      'CASH_TOPUP_CREATED',
      adminIds,
      { amount: String(request.amount) },
      {
        referenceType: 'cash_topup',
        referenceId: String(request.id),
        actionUrl: `/cash-topups`,
      },
    );
  }

  private async notifyCustomer(
    request: CashTopupRequestDocument,
    code: string,
    variables: Record<string, string>,
  ) {
    const customer = await this.customersService.findById(request.customerId);
    if (!customer?.userId) return;

    await this.notificationsService.notifyFromTemplate(
      code,
      [String(customer.userId)],
      variables,
      {
        referenceType: 'cash_topup',
        referenceId: String(request.id),
        actionUrl: `/cash-topups/${request.id}`,
      },
    );
  }
}

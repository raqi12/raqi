import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DepositRequest,
  DepositRequestDocument,
} from './schemas/deposit-request.schema';
import { WalletsService } from './wallets.service';

@Injectable()
export class DepositRequestsService {
  constructor(
    @InjectModel(DepositRequest.name)
    private readonly depositRequestModel: Model<DepositRequestDocument>,
    private readonly walletsService: WalletsService,
  ) {}

  create(input: {
    customerId: string;
    amount: number;
    evidenceImageUrl: string;
  }): Promise<DepositRequestDocument> {
    return this.depositRequestModel.create({
      customerId: input.customerId,
      amount: input.amount,
      evidenceImageUrl: input.evidenceImageUrl,
      status: 'pending',
    });
  }

  findAll(status?: 'pending' | 'approved' | 'rejected'): Promise<DepositRequestDocument[]> {
    const filter = status ? { status } : {};
    return this.depositRequestModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  findByCustomer(customerId: string): Promise<DepositRequestDocument[]> {
    return this.depositRequestModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  findById(id: string): Promise<DepositRequestDocument | null> {
    return this.depositRequestModel.findById(id).exec();
  }

  async approve(id: string, adminUserId: string): Promise<DepositRequestDocument> {
    const request = await this.depositRequestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException('Deposit request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Deposit request is not pending');
    }

    await this.walletsService.ensureWallet(request.customerId);
    const wallet = await this.walletsService.credit(
      request.customerId,
      request.amount,
    );
    if (!wallet) {
      throw new BadRequestException('Wallet not found for customer');
    }

    request.status = 'approved';
    request.reviewedBy = adminUserId;
    request.reviewedAt = new Date();
    request.rejectionReason = null;
    await request.save();
    return request;
  }

  async reject(
    id: string,
    adminUserId: string,
    rejectionReason?: string,
  ): Promise<DepositRequestDocument> {
    const request = await this.depositRequestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException('Deposit request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Deposit request is not pending');
    }

    request.status = 'rejected';
    request.reviewedBy = adminUserId;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason ?? null;
    await request.save();
    return request;
  }
}

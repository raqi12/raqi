import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schemas/wallet-transaction.schema';
import type { WalletTransactionType } from './wallet-transaction.types';

type ListOptions = {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
};

@Injectable()
export class WalletTransactionsService {
  constructor(
    @InjectModel(WalletTransaction.name)
    private readonly transactionModel: Model<WalletTransactionDocument>,
  ) {}

  create(
    input: Omit<WalletTransaction, 'createdAt' | 'updatedAt'>,
  ): Promise<WalletTransactionDocument> {
    return this.transactionModel.create(input);
  }

  updateReferenceId(
    id: string,
    referenceId: string,
  ): Promise<WalletTransactionDocument | null> {
    return this.transactionModel
      .findByIdAndUpdate(id, { referenceId }, { new: true })
      .exec();
  }

  async findByCustomer(customerId: string, options: ListOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const filter: Record<string, unknown> = { customerId };
    if (options.type) {
      filter.type = options.type;
    }

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}

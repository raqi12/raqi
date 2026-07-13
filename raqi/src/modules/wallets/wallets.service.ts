import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletTransactionDocument } from './schemas/wallet-transaction.schema';
import { WalletTransactionsService } from './wallet-transactions.service';
import type { ApplyWalletMovementInput } from './wallet-transaction.types';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    private readonly walletTransactionsService: WalletTransactionsService,
  ) {}

  async ensureWallet(customerId: string): Promise<WalletDocument> {
    const existing = await this.walletModel.findOne({ customerId }).exec();
    if (existing) {
      return existing;
    }
    return this.walletModel.create({ customerId, balance: 0 });
  }

  findByCustomerId(customerId: string): Promise<WalletDocument | null> {
    return this.walletModel.findOne({ customerId }).exec();
  }

  async applyMovement(input: ApplyWalletMovementInput): Promise<{
    wallet: WalletDocument;
    transaction: WalletTransactionDocument;
  }> {
    if (input.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.ensureWallet(input.customerId);
    const balanceBefore = wallet.balance;

    let updatedWallet: WalletDocument | null;
    if (input.direction === 'credit') {
      updatedWallet = await this.walletModel
        .findOneAndUpdate(
          { customerId: input.customerId },
          { $inc: { balance: input.amount } },
          { new: true },
        )
        .exec();
    } else {
      updatedWallet = await this.walletModel
        .findOneAndUpdate(
          { customerId: input.customerId, balance: { $gte: input.amount } },
          { $inc: { balance: -input.amount } },
          { new: true },
        )
        .exec();
      if (!updatedWallet) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    if (!updatedWallet) {
      throw new BadRequestException('Wallet not found for customer');
    }

    const transaction = await this.walletTransactionsService.create({
      customerId: input.customerId,
      type: input.type,
      direction: input.direction,
      amount: input.amount,
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      description: input.description ?? null,
      createdBy: input.createdBy ?? null,
    });

    return { wallet: updatedWallet, transaction };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
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

  async credit(customerId: string, amount: number): Promise<WalletDocument | null> {
    return this.walletModel
      .findOneAndUpdate(
        { customerId },
        { $inc: { balance: amount } },
        { new: true },
      )
      .exec();
  }

  async debit(customerId: string, amount: number): Promise<WalletDocument> {
    const wallet = await this.walletModel
      .findOneAndUpdate(
        { customerId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true },
      )
      .exec();
    if (!wallet) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    return wallet;
  }
}

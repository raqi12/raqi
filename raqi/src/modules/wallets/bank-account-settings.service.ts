import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BankAccountSettings,
  BankAccountSettingsDocument,
} from './schemas/bank-account-settings.schema';
import { UpdateBankAccountDto } from './dto/wallet.dto';

const SETTINGS_KEY = 'default';

@Injectable()
export class BankAccountSettingsService {
  constructor(
    @InjectModel(BankAccountSettings.name)
    private readonly settingsModel: Model<BankAccountSettingsDocument>,
  ) {}

  async getActive(): Promise<BankAccountSettingsDocument | null> {
    return this.settingsModel.findOne({ key: SETTINGS_KEY, active: true }).exec();
  }

  async getOrEmpty(): Promise<BankAccountSettingsDocument | null> {
    return this.settingsModel.findOne({ key: SETTINGS_KEY }).exec();
  }

  async upsert(body: UpdateBankAccountDto): Promise<BankAccountSettingsDocument> {
    return this.settingsModel
      .findOneAndUpdate(
        { key: SETTINGS_KEY },
        {
          key: SETTINGS_KEY,
          bankName: body.bankName,
          accountHolder: body.accountHolder,
          accountNumber: body.accountNumber,
          iban: body.iban ?? null,
          notes: body.notes ?? null,
          active: body.active ?? true,
        },
        { new: true, upsert: true },
      )
      .exec();
  }
}

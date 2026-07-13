import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateSupportSettingsDto } from './dto/support.dto';
import {
  SupportSettings,
  SupportSettingsDocument,
} from './schemas/support-settings.schema';
import { DEFAULT_WORKING_HOURS } from './support.defaults';

const SETTINGS_KEY = 'default';

@Injectable()
export class SupportSettingsService {
  constructor(
    @InjectModel(SupportSettings.name)
    private readonly settingsModel: Model<SupportSettingsDocument>,
  ) {}

  async getActive(): Promise<SupportSettingsDocument | null> {
    return this.settingsModel.findOne({ key: SETTINGS_KEY, active: true }).exec();
  }

  async getOrEmpty(): Promise<SupportSettingsDocument | null> {
    return this.settingsModel.findOne({ key: SETTINGS_KEY }).exec();
  }

  async ensureDefaults(): Promise<SupportSettingsDocument> {
    const existing = await this.getOrEmpty();
    if (existing) {
      return existing;
    }

    return this.settingsModel.create({
      key: SETTINGS_KEY,
      workingHours: DEFAULT_WORKING_HOURS,
    });
  }

  async upsert(body: UpdateSupportSettingsDto): Promise<SupportSettingsDocument> {
    return this.settingsModel
      .findOneAndUpdate(
        { key: SETTINGS_KEY },
        {
          key: SETTINGS_KEY,
          phone: body.phone,
          whatsapp: body.whatsapp,
          email: body.email,
          twitter: body.twitter,
          workingHours: body.workingHours,
          emergencyMessage: body.emergencyMessage,
          emergencyPhone: body.emergencyPhone,
          appVersion: body.appVersion,
          lastUpdateLabel: body.lastUpdateLabel,
          active: body.active ?? true,
        },
        { new: true, upsert: true },
      )
      .exec();
  }
}

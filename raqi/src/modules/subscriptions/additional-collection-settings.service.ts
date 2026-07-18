import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateAdditionalCollectionSettingsDto } from './dto/subscription.dto';
import {
  AdditionalCollectionSettings,
  AdditionalCollectionSettingsDocument,
} from './schemas/additional-collection-settings.schema';

const SETTINGS_KEY = 'default';

@Injectable()
export class AdditionalCollectionSettingsService {
  constructor(
    @InjectModel(AdditionalCollectionSettings.name)
    private readonly settingsModel: Model<AdditionalCollectionSettingsDocument>,
  ) {}

  async getActive(): Promise<AdditionalCollectionSettingsDocument | null> {
    return this.settingsModel
      .findOne({ key: SETTINGS_KEY, active: true })
      .exec();
  }

  async getOrEmpty(): Promise<AdditionalCollectionSettingsDocument | null> {
    return this.settingsModel.findOne({ key: SETTINGS_KEY }).exec();
  }

  async upsert(
    body: UpdateAdditionalCollectionSettingsDto,
  ): Promise<AdditionalCollectionSettingsDocument> {
    return this.settingsModel
      .findOneAndUpdate(
        { key: SETTINGS_KEY },
        {
          key: SETTINGS_KEY,
          price: body.price,
          active: body.active ?? true,
        },
        { new: true, upsert: true },
      )
      .exec();
  }
}

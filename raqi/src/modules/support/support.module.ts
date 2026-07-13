import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from './schemas/faq.schema';
import {
  SupportSettings,
  SupportSettingsSchema,
} from './schemas/support-settings.schema';
import { FaqsService } from './faqs.service';
import {
  AdminSupportController,
  CustomerSupportController,
  PublicSupportController,
} from './support.controller';
import { SupportSettingsService } from './support-settings.service';
import { SupportService } from './support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportSettings.name, schema: SupportSettingsSchema },
      { name: Faq.name, schema: FaqSchema },
    ]),
  ],
  controllers: [
    PublicSupportController,
    CustomerSupportController,
    AdminSupportController,
  ],
  providers: [SupportSettingsService, FaqsService, SupportService],
  exports: [SupportService, SupportSettingsService, FaqsService],
})
export class SupportModule {}

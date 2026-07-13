import { Injectable } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { SupportSettingsService } from './support-settings.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportSettingsService: SupportSettingsService,
    private readonly faqsService: FaqsService,
  ) {}

  async getPublicPayload() {
    await this.faqsService.ensureDefaults();
    const settings = await this.supportSettingsService.ensureDefaults();
    const faqs = await this.faqsService.findActive();

    return {
      contacts: {
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        twitter: settings.twitter,
      },
      workingHours: settings.workingHours,
      faqs: faqs.map((faq) => ({
        id: String(faq.id),
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
      })),
      emergency: {
        message: settings.emergencyMessage,
        phone: settings.emergencyPhone,
      },
      appInfo: {
        version: settings.appVersion,
        lastUpdate: settings.lastUpdateLabel,
      },
    };
  }
}

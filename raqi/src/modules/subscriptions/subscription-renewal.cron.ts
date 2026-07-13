import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionRenewalService } from './subscription-renewal.service';

@Injectable()
export class SubscriptionRenewalCron {
  constructor(
    private readonly subscriptionRenewalService: SubscriptionRenewalService,
  ) {}

  @Cron('0 2 * * *')
  handleDailyRenewals() {
    return this.subscriptionRenewalService.processDueRenewals();
  }
}

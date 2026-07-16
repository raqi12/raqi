import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduleCron {
  private readonly logger = new Logger(NotificationScheduleCron.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron('* * * * *')
  async processDue() {
    const count = await this.notificationsService.processDueSchedules();
    if (count > 0) {
      this.logger.log(`Processed ${count} scheduled notification(s)`);
    }
  }
}

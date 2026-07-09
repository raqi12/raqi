import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TasksService } from '../tasks/tasks.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tasksService: TasksService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async overview() {
    const [activeSubscriptions, completedTasks, totalRevenue] =
      await Promise.all([
        this.subscriptionsService.countActive(),
        this.tasksService.countCompleted(),
        this.paymentsService.sumRevenue(),
      ]);

    return {
      activeSubscriptions,
      completedTasks,
      totalRevenue,
      generatedAt: new Date().toISOString(),
    };
  }
}

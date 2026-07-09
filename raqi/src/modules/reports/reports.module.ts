import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [SubscriptionsModule, TasksModule, PaymentsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

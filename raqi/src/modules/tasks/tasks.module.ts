import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasModule } from '../areas/areas.module';
import { BinsModule } from '../bins/bins.module';
import { CitiesModule } from '../cities/cities.module';
import { CustomersModule } from '../customers/customers.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SupportModule } from '../support/support.module';
import { Task, TaskSchema } from './schemas/task.schema';
import {
  AdminTasksController,
  CustomerTasksController,
  DriverTasksController,
} from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => CustomersModule),
    DriversModule,
    AreasModule,
    CitiesModule,
    BinsModule,
    SupportModule,
    NotificationsModule,
  ],
  controllers: [
    AdminTasksController,
    DriverTasksController,
    CustomerTasksController,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

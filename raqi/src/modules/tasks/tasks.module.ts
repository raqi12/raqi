import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CustomersModule } from '../customers/customers.module';
import { DriversModule } from '../drivers/drivers.module';
import { AreasModule } from '../areas/areas.module';
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
    SubscriptionsModule,
    forwardRef(() => CustomersModule),
    DriversModule,
    AreasModule,
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

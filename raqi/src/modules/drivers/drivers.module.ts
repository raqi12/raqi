import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasModule } from '../areas/areas.module';
import { CitiesModule } from '../cities/cities.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { DriverAccountController } from './driver-account.controller';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver, DriverSchema } from './schemas/driver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
    UsersModule,
    CitiesModule,
    AreasModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [DriversController, DriverAccountController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}

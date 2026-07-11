import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasModule } from '../areas/areas.module';
import { CitiesModule } from '../cities/cities.module';
import { UsersModule } from '../users/users.module';
import { Driver, DriverSchema } from './schemas/driver.schema';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
    UsersModule,
    CitiesModule,
    AreasModule,
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}

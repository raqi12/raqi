import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasModule } from '../areas/areas.module';
import { BinsModule } from '../bins/bins.module';
import { CitiesModule } from '../cities/cities.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Address, AddressSchema } from './schemas/address.schema';
import {
  AdminCustomersController,
  CustomerAddressesController,
} from './customers.controller';
import { CustomerAdminService } from './customer-admin.service';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Address.name, schema: AddressSchema },
    ]),
    UsersModule,
    CitiesModule,
    AreasModule,
    forwardRef(() => WalletsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => BinsModule),
    forwardRef(() => TasksModule),
    forwardRef(() => ComplaintsModule),
  ],
  controllers: [AdminCustomersController, CustomerAddressesController],
  providers: [CustomersService, CustomerAdminService],
  exports: [CustomersService],
})
export class CustomersModule {}

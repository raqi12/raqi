import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Address, AddressSchema } from './schemas/address.schema';
import {
  AdminCustomersController,
  CustomerAddressesController,
} from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Address.name, schema: AddressSchema },
    ]),
    UsersModule,
    forwardRef(() => WalletsModule),
  ],
  controllers: [AdminCustomersController, CustomerAddressesController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

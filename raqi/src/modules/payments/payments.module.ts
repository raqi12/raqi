import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from '../customers/customers.module';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import {
  AdminPaymentsController,
  CustomerPaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    CustomersModule,
  ],
  controllers: [AdminPaymentsController, CustomerPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

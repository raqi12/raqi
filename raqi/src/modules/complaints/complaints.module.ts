import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from '../customers/customers.module';
import { Complaint, ComplaintSchema } from './schemas/complaint.schema';
import {
  AdminComplaintsController,
  CustomerComplaintsController,
} from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Complaint.name, schema: ComplaintSchema },
    ]),
    CustomersModule,
  ],
  controllers: [CustomerComplaintsController, AdminComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}

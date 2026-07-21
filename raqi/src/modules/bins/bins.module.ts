import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bin, BinSchema } from './schemas/bin.schema';
import {
  BinAssignment,
  BinAssignmentSchema,
} from './schemas/bin-assignment.schema';
import { BinsController, CustomerBinsController } from './bins.controller';
import { BinsService } from './bins.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bin.name, schema: BinSchema },
      { name: BinAssignment.name, schema: BinAssignmentSchema },
    ]),
  ],
  controllers: [BinsController, CustomerBinsController],
  providers: [BinsService],
  exports: [BinsService],
})
export class BinsModule {}

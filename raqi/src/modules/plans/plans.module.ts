import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from './schemas/plan.schema';
import { AdminPlansController, PublicPlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
  ],
  controllers: [PublicPlansController, AdminPlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}

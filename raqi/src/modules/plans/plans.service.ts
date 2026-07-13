import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BinsService } from '../bins/bins.service';
import { Plan, PlanDocument } from './schemas/plan.schema';

export type SubscriptionCost = {
  planId: string;
  binId: string | null;
  planPrice: number;
  binFee: number;
  total: number;
};

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    private readonly binsService: BinsService,
  ) {}

  create(input: Partial<Plan>): Promise<PlanDocument> {
    return this.planModel.create(input);
  }

  findActive(): Promise<PlanDocument[]> {
    return this.planModel.find({ active: true }).exec();
  }

  findAll(): Promise<PlanDocument[]> {
    return this.planModel.find().exec();
  }

  findById(id: string): Promise<PlanDocument | null> {
    return this.planModel.findById(id).exec();
  }

  update(id: string, patch: Partial<Plan>): Promise<PlanDocument | null> {
    return this.planModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  async calculateCost(
    planId: string,
    binId?: string,
  ): Promise<SubscriptionCost> {
    const plan = await this.findById(planId);
    if (!plan || !plan.active) {
      throw new BadRequestException('Plan is not available');
    }

    let binFee = 0;
    if (binId) {
      const bin = await this.binsService.findById(binId);
      if (!bin) {
        throw new BadRequestException('Bin not found');
      }
      binFee = bin.fee ?? 0;
    }

    const planPrice = plan.price;
    return {
      planId,
      binId: binId ?? null,
      planPrice,
      binFee,
      total: planPrice + binFee,
    };
  }
}

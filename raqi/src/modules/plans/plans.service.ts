import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
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
}

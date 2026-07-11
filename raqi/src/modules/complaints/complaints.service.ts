import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintDocument } from './schemas/complaint.schema';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name)
    private readonly complaintModel: Model<ComplaintDocument>,
  ) {}

  create(input: {
    customerId: string;
    subject: string;
    body: string;
  }): Promise<ComplaintDocument> {
    return this.complaintModel.create(input);
  }

  findAll(): Promise<ComplaintDocument[]> {
    return this.complaintModel.find().exec();
  }

  findByCustomer(customerId: string): Promise<ComplaintDocument[]> {
    return this.complaintModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  update(
    id: string,
    patch: Partial<Complaint>,
  ): Promise<ComplaintDocument | null> {
    return this.complaintModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {}

  create(input: {
    userId: string;
    vehicleNumber: string;
  }): Promise<DriverDocument> {
    return this.driverModel.create(input);
  }

  findAll(): Promise<DriverDocument[]> {
    return this.driverModel.find().exec();
  }

  findById(id: string): Promise<DriverDocument | null> {
    return this.driverModel.findById(id).exec();
  }

  update(id: string, patch: Partial<Driver>): Promise<DriverDocument | null> {
    return this.driverModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area, AreaDocument } from './schemas/area.schema';

@Injectable()
export class AreasService {
  constructor(
    @InjectModel(Area.name) private readonly areaModel: Model<AreaDocument>,
  ) {}

  create(input: { name: string; city: string }): Promise<AreaDocument> {
    return this.areaModel.create(input);
  }

  findAll(): Promise<AreaDocument[]> {
    return this.areaModel.find().exec();
  }
}

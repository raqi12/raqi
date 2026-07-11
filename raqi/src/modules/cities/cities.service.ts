import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area, AreaDocument } from '../areas/schemas/area.schema';
import { City, CityDocument } from './schemas/city.schema';

@Injectable()
export class CitiesService {
  constructor(
    @InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
    @InjectModel(Area.name) private readonly areaModel: Model<AreaDocument>,
  ) {}

  create(input: { name: string }): Promise<CityDocument> {
    return this.cityModel.create({ name: input.name.trim() });
  }

  findAll(): Promise<CityDocument[]> {
    return this.cityModel.find().sort({ name: 1 }).exec();
  }

  findById(id: string): Promise<CityDocument | null> {
    return this.cityModel.findById(id).exec();
  }

  findByName(name: string): Promise<CityDocument | null> {
    return this.cityModel.findOne({ name: name.trim() }).exec();
  }

  async update(id: string, patch: { name?: string }): Promise<CityDocument | null> {
    const update: Partial<City> = {};
    if (patch.name !== undefined) {
      update.name = patch.name.trim();
    }
    return this.cityModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  countAreasByCityId(cityId: string): Promise<number> {
    return this.areaModel.countDocuments({ cityId }).exec();
  }

  async delete(id: string): Promise<CityDocument | null> {
    const areaCount = await this.countAreasByCityId(id);
    if (areaCount > 0) {
      throw new BadRequestException('Cannot delete city with existing areas');
    }
    return this.cityModel.findByIdAndDelete(id).exec();
  }

  async ensureUniqueName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.findByName(name);
    if (existing && String(existing.id) !== excludeId) {
      throw new ConflictException('City name already exists');
    }
  }
}

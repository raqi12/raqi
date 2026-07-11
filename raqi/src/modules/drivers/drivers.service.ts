import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AreasService } from '../areas/areas.service';
import { CitiesService } from '../cities/cities.service';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    private readonly citiesService: CitiesService,
    private readonly areasService: AreasService,
  ) {}

  async create(input: {
    userId: string;
    vehicleNumber: string;
    cityId: string;
    areaId: string;
  }): Promise<DriverDocument> {
    await this.validateLocation(input.cityId, input.areaId);
    return this.driverModel.create(input);
  }

  findAll(): Promise<DriverDocument[]> {
    return this.driverModel.find().exec();
  }

  findById(id: string): Promise<DriverDocument | null> {
    return this.driverModel.findById(id).exec();
  }

  findByLocation(cityId: string, areaId: string): Promise<DriverDocument[]> {
    return this.driverModel
      .find({ cityId, areaId, status: 'active' })
      .exec();
  }

  async update(id: string, patch: Partial<Driver>): Promise<DriverDocument | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const nextCityId = patch.cityId ?? existing.cityId;
    const nextAreaId = patch.areaId ?? existing.areaId;

    if (patch.cityId !== undefined || patch.areaId !== undefined) {
      await this.validateLocation(nextCityId, nextAreaId);
    }

    return this.driverModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  private async validateLocation(cityId: string, areaId: string): Promise<void> {
    const city = await this.citiesService.findById(cityId);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const area = await this.areasService.findById(areaId);
    if (!area) {
      throw new NotFoundException('Area not found');
    }

    if (area.cityId !== cityId) {
      throw new BadRequestException('Area does not belong to the selected city');
    }
  }
}

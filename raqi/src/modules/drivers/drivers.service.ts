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
    rating?: number | null;
  }): Promise<DriverDocument> {
    await this.validateLocation(input.cityId, input.areaId);
    const code = await this.generateUniqueCode();
    return this.driverModel.create({
      ...input,
      code,
      rating: input.rating ?? null,
    });
  }

  findAll(): Promise<DriverDocument[]> {
    return this.driverModel.find().exec();
  }

  findById(id: string): Promise<DriverDocument | null> {
    return this.driverModel.findById(id).exec();
  }

  findByUserId(userId: string): Promise<DriverDocument | null> {
    return this.driverModel.findOne({ userId }).exec();
  }

  findByLocation(cityId: string, areaId: string): Promise<DriverDocument[]> {
    return this.driverModel
      .find({ cityId, areaId, status: 'active' })
      .exec();
  }

  async ensureCode(driver: DriverDocument): Promise<DriverDocument> {
    if (driver.code) {
      return driver;
    }
    const code = await this.generateUniqueCode();
    const updated = await this.driverModel
      .findByIdAndUpdate(driver.id, { code }, { new: true })
      .exec();
    return updated ?? driver;
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

    if (patch.code !== undefined && patch.code !== existing.code) {
      const clash = await this.driverModel
        .findOne({ code: patch.code, _id: { $ne: id } })
        .exec();
      if (clash) {
        throw new BadRequestException('Driver code already in use');
      }
    }

    if (patch.rating !== undefined && patch.rating !== null) {
      if (patch.rating < 0 || patch.rating > 5) {
        throw new BadRequestException('Rating must be between 0 and 5');
      }
    }

    return this.driverModel.findByIdAndUpdate(id, patch, { new: true }).exec();
  }

  private async generateUniqueCode(): Promise<string> {
    const total = await this.driverModel.countDocuments().exec();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const n = total + 1 + attempt;
      const code = `DR-${String(n).padStart(4, '0')}`;
      const exists = await this.driverModel.findOne({ code }).exec();
      if (!exists) {
        return code;
      }
    }
    return `DR-${Date.now().toString(36).toUpperCase()}`;
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

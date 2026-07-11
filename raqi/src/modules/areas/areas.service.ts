import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CitiesService } from '../cities/cities.service';
import { Route, RouteDocument } from '../routes/schemas/route.schema';
import { Area, AreaDocument } from './schemas/area.schema';

@Injectable()
export class AreasService {
  constructor(
    @InjectModel(Area.name) private readonly areaModel: Model<AreaDocument>,
    @InjectModel(Route.name) private readonly routeModel: Model<RouteDocument>,
    private readonly citiesService: CitiesService,
  ) {}

  async create(input: { name: string; cityId: string }): Promise<AreaDocument> {
    const city = await this.citiesService.findById(input.cityId);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    await this.ensureUniqueNameInCity(input.cityId, input.name);
    return this.areaModel.create({
      name: input.name.trim(),
      cityId: input.cityId,
    });
  }

  findAll(cityId?: string): Promise<AreaDocument[]> {
    const filter = cityId ? { cityId } : {};
    return this.areaModel.find(filter).sort({ name: 1 }).exec();
  }

  findById(id: string): Promise<AreaDocument | null> {
    return this.areaModel.findById(id).exec();
  }

  countByCityId(cityId: string): Promise<number> {
    return this.areaModel.countDocuments({ cityId }).exec();
  }

  async update(
    id: string,
    patch: { name?: string; cityId?: string },
  ): Promise<AreaDocument | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const nextCityId = patch.cityId ?? existing.cityId;
    const nextName = patch.name?.trim() ?? existing.name;

    if (patch.cityId) {
      const city = await this.citiesService.findById(patch.cityId);
      if (!city) {
        throw new NotFoundException('City not found');
      }
    }

    if (patch.name !== undefined || patch.cityId !== undefined) {
      await this.ensureUniqueNameInCity(nextCityId, nextName, id);
    }

    const update: Partial<Area> = {};
    if (patch.name !== undefined) {
      update.name = nextName;
    }
    if (patch.cityId !== undefined) {
      update.cityId = patch.cityId;
    }

    return this.areaModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async delete(id: string): Promise<AreaDocument | null> {
    const referenced = await this.routeModel.exists({ areaId: id });
    if (referenced) {
      throw new BadRequestException('Cannot delete area linked to routes');
    }
    return this.areaModel.findByIdAndDelete(id).exec();
  }

  private async ensureUniqueNameInCity(
    cityId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.areaModel
      .findOne({ cityId, name: name.trim() })
      .exec();
    if (existing && String(existing.id) !== excludeId) {
      throw new ConflictException('Area name already exists in this city');
    }
  }
}

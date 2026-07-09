import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Route, RouteDocument } from './schemas/route.schema';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name) private readonly routeModel: Model<RouteDocument>,
  ) {}

  create(input: {
    name: string;
    areaId: string;
    stops?: string[];
  }): Promise<RouteDocument> {
    return this.routeModel.create({ ...input, stops: input.stops ?? [] });
  }

  findAll(): Promise<RouteDocument[]> {
    return this.routeModel.find().exec();
  }
}

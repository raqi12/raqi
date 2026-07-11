import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Area, AreaSchema } from '../areas/schemas/area.schema';
import { CitiesController, PublicCitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { City, CitySchema } from './schemas/city.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: City.name, schema: CitySchema },
      { name: Area.name, schema: AreaSchema },
    ]),
  ],
  controllers: [PublicCitiesController, CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitiesModule } from '../cities/cities.module';
import { Route, RouteSchema } from '../routes/schemas/route.schema';
import { AreasController, PublicAreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { Area, AreaSchema } from './schemas/area.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Area.name, schema: AreaSchema },
      { name: Route.name, schema: RouteSchema },
    ]),
    CitiesModule,
  ],
  controllers: [PublicAreasController, AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}

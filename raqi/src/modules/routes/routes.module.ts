import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Route, RouteSchema } from './schemas/route.schema';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Route.name, schema: RouteSchema }]),
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}

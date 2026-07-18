import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminGalleryController,
  CustomerGalleryController,
  DriverGalleryController,
} from './gallery.controller';
import { GalleryService } from './gallery.service';
import { Gallery, GallerySchema } from './schemas/gallery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gallery.name, schema: GallerySchema }]),
  ],
  controllers: [
    CustomerGalleryController,
    DriverGalleryController,
    AdminGalleryController,
  ],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}

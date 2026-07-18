import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminContentPagesController,
  CustomerContentPagesController,
  DriverContentPagesController,
  PublicContentPagesController,
} from './content-pages.controller';
import { ContentPagesService } from './content-pages.service';
import {
  ContentPage,
  ContentPageSchema,
} from './schemas/content-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentPage.name, schema: ContentPageSchema },
    ]),
  ],
  controllers: [
    PublicContentPagesController,
    CustomerContentPagesController,
    DriverContentPagesController,
    AdminContentPagesController,
  ],
  providers: [ContentPagesService],
  exports: [ContentPagesService],
})
export class ContentPagesModule {}

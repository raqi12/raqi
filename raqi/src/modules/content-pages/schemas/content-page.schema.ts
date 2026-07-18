import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  CONTENT_PAGE_SLUGS,
  type ContentPageSlug,
} from '../content-page.slugs';

export type ContentPageDocument = HydratedDocument<ContentPage>;

@Schema(baseSchemaOptions)
export class ContentPage {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    enum: CONTENT_PAGE_SLUGS,
  })
  slug: ContentPageSlug;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPage);

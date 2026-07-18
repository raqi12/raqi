import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type GalleryDocument = HydratedDocument<Gallery>;

@Schema(baseSchemaOptions)
export class Gallery {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  imageUrl: string;

  @Prop({ trim: true, default: '' })
  caption: string;

  @Prop({ trim: true, default: '' })
  linkUrl: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
GallerySchema.index({ sortOrder: 1 });
GallerySchema.index({ active: 1, sortOrder: 1 });

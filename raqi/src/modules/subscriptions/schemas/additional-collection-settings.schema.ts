import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type AdditionalCollectionSettingsDocument =
  HydratedDocument<AdditionalCollectionSettings>;

@Schema(baseSchemaOptions)
export class AdditionalCollectionSettings {
  @Prop({ required: true, default: 'default' })
  key: string;

  @Prop({ required: true, default: 0, min: 0 })
  price: number;

  @Prop({ default: true })
  active: boolean;
}

export const AdditionalCollectionSettingsSchema = SchemaFactory.createForClass(
  AdditionalCollectionSettings,
);
AdditionalCollectionSettingsSchema.index({ key: 1 }, { unique: true });

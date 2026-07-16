import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import { DEVICE_TYPES, type DeviceType } from '../notification.enums';

export type DeviceTokenDocument = HydratedDocument<DeviceToken>;

@Schema(baseSchemaOptions)
export class DeviceToken {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({
    type: String,
    required: true,
    enum: DEVICE_TYPES,
    default: 'android',
  })
  deviceType: DeviceType;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastUsedAt: Date | null;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

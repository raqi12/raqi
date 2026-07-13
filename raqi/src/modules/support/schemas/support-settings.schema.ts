import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';
import {
  WorkingHoursRange,
  WorkingHoursRangeSchema,
} from './working-hours-range.schema';

export type SupportSettingsDocument = HydratedDocument<SupportSettings>;

@Schema(baseSchemaOptions)
export class SupportSettings {
  @Prop({ required: true, default: 'default' })
  key: string;

  @Prop({ required: true, default: '920000000' })
  phone: string;

  @Prop({ required: true, default: '091xxxxxxxx' })
  whatsapp: string;

  @Prop({ required: true, default: 'support@text.sa' })
  email: string;

  @Prop({ required: true, default: 'text' })
  twitter: string;

  @Prop({ type: [WorkingHoursRangeSchema], default: [] })
  workingHours: WorkingHoursRange[];

  @Prop({
    required: true,
    default:
      'حالة طوارئ: للإبلاغ عن مشاكل عاجلة مثل انسكاب النفايات أو تأخير حرج، اتصل بخط الطوارئ.',
  })
  emergencyMessage: string;

  @Prop({ required: true, default: '920000000' })
  emergencyPhone: string;

  @Prop({ required: true, default: 'v2.4.1' })
  appVersion: string;

  @Prop({ required: true, default: 'يونيو ٢٠٢٦' })
  lastUpdateLabel: string;

  @Prop({ default: true })
  active: boolean;
}

export const SupportSettingsSchema =
  SchemaFactory.createForClass(SupportSettings);
SupportSettingsSchema.index({ key: 1 }, { unique: true });

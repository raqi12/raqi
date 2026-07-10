import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type OtpDocument = HydratedDocument<Otp>;
export type OtpPurpose = 'register' | 'reset_password';

export type RegisterOtpPayload = {
  fullName: string;
  password: string;
  activityType: string;
};

@Schema(baseSchemaOptions)
export class Otp {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ type: String, required: true, enum: ['register', 'reset_password'] })
  purpose: OtpPurpose;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  payload: RegisterOtpPayload | null;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

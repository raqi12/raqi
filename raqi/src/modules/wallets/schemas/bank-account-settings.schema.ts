import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type BankAccountSettingsDocument = HydratedDocument<BankAccountSettings>;

@Schema(baseSchemaOptions)
export class BankAccountSettings {
  @Prop({ required: true, default: 'default' })
  key: string;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  accountHolder: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ type: String, default: null })
  iban: string | null;

  @Prop({ type: String, default: null })
  notes: string | null;

  @Prop({ default: true })
  active: boolean;
}

export const BankAccountSettingsSchema =
  SchemaFactory.createForClass(BankAccountSettings);
BankAccountSettingsSchema.index({ key: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema(baseSchemaOptions)
export class Wallet {
  @Prop({ required: true, unique: true, index: true })
  customerId: string;

  @Prop({ required: true, min: 0, default: 0 })
  balance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

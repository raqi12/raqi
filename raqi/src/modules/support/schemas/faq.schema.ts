import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type FaqDocument = HydratedDocument<Faq>;

@Schema(baseSchemaOptions)
export class Faq {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
FaqSchema.index({ sortOrder: 1 });

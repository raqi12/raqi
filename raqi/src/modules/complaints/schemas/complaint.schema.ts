import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type ComplaintDocument = HydratedDocument<Complaint>;

@Schema(baseSchemaOptions)
export class Complaint {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    type: String,
    required: true,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: 'open' | 'in_progress' | 'resolved' | 'closed';

  @Prop({ type: String, default: null })
  assignee: string | null;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../database/schema.options';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  Pending = 'pending',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Skipped = 'skipped',
  Cancelled = 'cancelled',
}

@Schema(baseSchemaOptions)
export class Task {
  @Prop({ required: true, index: true })
  subscriptionId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ type: String, default: null, index: true })
  driverId: string | null;

  @Prop({ required: true, index: true })
  areaId: string;

  @Prop({ required: true })
  scheduledDate: string;

  @Prop({
    type: String,
    required: true,
    enum: TaskStatus,
    default: TaskStatus.Pending,
    index: true,
  })
  status: TaskStatus;

  @Prop({ type: String, default: null })
  photo: string | null;

  @Prop({ type: String, default: null })
  note: string | null;

  @Prop({ type: String, default: null })
  skipReason: string | null;

  @Prop({ type: String, default: null })
  skipLocation: string | null;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  skippedAt: Date | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index(
  { subscriptionId: 1, scheduledDate: 1 },
  { unique: true },
);

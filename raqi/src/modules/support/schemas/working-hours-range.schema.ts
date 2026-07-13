import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class WorkingHoursRange {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;
}

export const WorkingHoursRangeSchema =
  SchemaFactory.createForClass(WorkingHoursRange);

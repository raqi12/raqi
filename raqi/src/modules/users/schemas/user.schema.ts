import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/roles.enum';
import { baseSchemaOptions } from '../../../database/schema.options';

export type UserDocument = HydratedDocument<User>;

@Schema(baseSchemaOptions)
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ type: String, unique: true, sparse: true, index: true })
  phone?: string;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, required: true, enum: Role, index: true })
  role: Role;

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';
}

export const UserSchema = SchemaFactory.createForClass(User);

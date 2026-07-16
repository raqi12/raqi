import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Role } from '../../../common/roles.enum';
import {
  DEVICE_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  SCHEDULED_NOTIFICATION_STATUSES,
} from '../notification.enums';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_CATEGORIES })
  @IsOptional()
  @IsIn(NOTIFICATION_CATEGORIES)
  category?: (typeof NOTIFICATION_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}

export class BulkIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids: string[];
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'fcm-device-token' })
  @IsString()
  token: string;

  @ApiProperty({ enum: DEVICE_TYPES, example: 'android' })
  @IsIn(DEVICE_TYPES)
  deviceType: (typeof DEVICE_TYPES)[number];
}

export class CategoryPreferenceDto {
  @ApiProperty({ enum: NOTIFICATION_CATEGORIES })
  @IsIn(NOTIFICATION_CATEGORIES)
  category: (typeof NOTIFICATION_CATEGORIES)[number];

  @ApiProperty({ example: true })
  @IsBoolean()
  inApp: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  push: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  email: boolean;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ type: [CategoryPreferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryPreferenceDto)
  categories?: CategoryPreferenceDto[];
}

export class SendNotificationDto {
  @ApiProperty({ example: 'تنبيه هام' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'تم تحديث حالة الاشتراك' })
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES, example: 'announcement' })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_CATEGORIES, example: 'general' })
  @IsOptional()
  @IsIn(NOTIFICATION_CATEGORIES)
  category?: (typeof NOTIFICATION_CATEGORIES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_PRIORITIES, example: 'medium' })
  @IsOptional()
  @IsIn(NOTIFICATION_PRIORITIES)
  priority?: (typeof NOTIFICATION_PRIORITIES)[number];

  @ApiPropertyOptional({
    enum: ['user', 'users', 'role', 'roles', 'all'],
    example: 'all',
  })
  @IsOptional()
  @IsIn(['user', 'users', 'role', 'roles', 'all'])
  audience?: 'user' | 'users' | 'role' | 'roles' | 'all';

  @ApiPropertyOptional({ description: 'Single user id when audience=user' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ type: [String], description: 'When audience=users' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    enum: Role,
    description: 'When audience=role',
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({
    enum: Role,
    isArray: true,
    description: 'When audience=roles — e.g. driver+customer, or admin for dashboard',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(Object.values(Role), { each: true })
  roles?: Role[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class ScheduleNotificationDto extends SendNotificationDto {
  @ApiProperty({ example: '2026-07-20T10:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({
    enum: SCHEDULED_NOTIFICATION_STATUSES,
    example: 'scheduled',
  })
  @IsOptional()
  @IsIn(['draft', 'scheduled'])
  status?: 'draft' | 'scheduled';
}

export class UpdateScheduledNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ enum: ['draft', 'scheduled', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'scheduled', 'cancelled'])
  status?: 'draft' | 'scheduled' | 'cancelled';
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'TICKET_CREATED' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  titleTemplate: string;

  @ApiProperty()
  @IsString()
  bodyTemplate: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_CATEGORIES })
  @IsOptional()
  @IsIn(NOTIFICATION_CATEGORIES)
  category?: (typeof NOTIFICATION_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_CATEGORIES })
  @IsOptional()
  @IsIn(NOTIFICATION_CATEGORIES)
  category?: (typeof NOTIFICATION_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], example: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}

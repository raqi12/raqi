import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GenerateTasksDto {
  @ApiProperty({ example: '2026-07-10', description: 'Task generation date (ISO 8601)' })
  @IsString()
  date: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Area MongoDB ID' })
  @IsString()
  areaId: string;
}

export class AssignTaskDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Driver MongoDB ID' })
  @IsString()
  driverId: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({
    example: 'https://cdn.raqi.local/uploads/collection-proof.jpg',
    description: 'Photo URL of completed collection (optional proof)',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({
    example: 'تم التجميع بنجاح',
    description: 'Driver note about the collection',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class SkipTaskDto {
  @ApiProperty({
    example: 'الحاوية غير موجودة في الموقع',
    description: 'Reason the collection could not be completed (problem on site)',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    example: '32.8872,13.1913',
    description: 'GPS coordinates when the problem was reported',
  })
  @IsString()
  location: string;

  @ApiPropertyOptional({
    example: 'https://cdn.raqi.local/uploads/problem-evidence.jpg',
    description: 'Optional photo evidence of the problem',
  })
  @IsOptional()
  @IsString()
  photo?: string;
}

/** Filter for today's driver task list (matches المهام tabs). */
export const DRIVER_TODAY_STATUS_FILTERS = [
  'all',
  'upcoming',
  'in_progress',
  'completed',
] as const;

export type DriverTodayStatusFilter =
  (typeof DRIVER_TODAY_STATUS_FILTERS)[number];

export class DriverTodayTasksQueryDto {
  @ApiPropertyOptional({
    enum: DRIVER_TODAY_STATUS_FILTERS,
    example: 'all',
    description:
      'Filter tab: all | upcoming (قادمة/assigned) | in_progress (جارية) | completed (مكتملة)',
  })
  @IsOptional()
  @IsIn(DRIVER_TODAY_STATUS_FILTERS)
  status?: DriverTodayStatusFilter;
}

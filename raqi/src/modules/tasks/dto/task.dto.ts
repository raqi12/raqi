import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
  @ApiPropertyOptional({ example: 'https://cdn.raqi.local/uploads/collection-proof.jpg', description: 'Photo URL of completed collection' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ example: 'تم التجميع بنجاح', description: 'Driver note about the collection' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class SkipTaskDto {
  @ApiProperty({ example: 'الحاوية غير موجودة في الموقع', description: 'Reason for skipping the task' })
  @IsString()
  reason: string;

  @ApiProperty({ example: '32.8872,13.1913', description: 'GPS coordinates at time of skip' })
  @IsString()
  location: string;
}

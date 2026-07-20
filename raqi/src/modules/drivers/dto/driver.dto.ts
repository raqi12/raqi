import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateDriverDto {
  @ApiPropertyOptional({
    example: 'driver@raqi.local',
    format: 'email',
    description: 'Optional login email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+218912345678',
    description: 'Driver phone number (required for login when email is omitted)',
  })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'محمد السائق', description: 'Driver full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6, description: 'Account password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'طرابلس-1234', description: 'Vehicle registration number' })
  @IsString()
  vehicleNumber: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID' })
  @IsString()
  cityId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Service area ID' })
  @IsString()
  areaId: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ example: 'طرابلس-5678', description: 'Updated vehicle registration number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Service area ID' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({ example: 'DR-2045', description: 'Driver display / employee code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 4.9,
    description: 'Driver rating 0–5 (null clears)',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number | null;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active', description: 'Driver account status' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdateDriverStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'], example: 'active', description: 'Driver account status' })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

export class DriverMonthlyStatsQueryDto {
  @ApiPropertyOptional({ example: 2026, description: 'UTC year (defaults to current)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ example: 7, description: 'UTC month 1–12 (defaults to current)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ example: 'أحمد محمد السالم' })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsString()
  name?: string;
}

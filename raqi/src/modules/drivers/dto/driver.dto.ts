import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @ApiProperty({ example: 'driver@raqi.local', format: 'email', description: 'Driver login email' })
  @IsEmail()
  email: string;

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
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ example: 'طرابلس-5678', description: 'Updated vehicle registration number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

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

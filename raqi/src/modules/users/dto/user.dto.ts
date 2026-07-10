import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/roles.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'support@raqi.local', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'أحمد الدعم' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.Admin, description: 'User role' })
  @IsEnum(Role)
  role: Role;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'أحمد الدعم المحدث' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'support@raqi.local' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

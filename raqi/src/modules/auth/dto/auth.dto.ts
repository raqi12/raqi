import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CUSTOMER_TYPES } from '../../../common/customer-type';

export class RegisterDto {
  @ApiProperty({ example: 'مصطفى عيسى', description: 'Full legal name of the customer' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+218912345678', description: 'Libyan phone number with country code' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6, description: 'Account password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6, description: 'Must match password' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ enum: CUSTOMER_TYPES, example: 'home', description: 'Customer activity type' })
  @IsIn(CUSTOMER_TYPES)
  activityType: (typeof CUSTOMER_TYPES)[number];
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  otp: string;

  @ApiProperty({ enum: ['register'], example: 'register' })
  @IsIn(['register'])
  purpose: 'register';
}

export class LoginDto {
  @ApiPropertyOptional({ example: 'admin@raqi.local', description: 'Staff login email (xor phone)' })
  @ValidateIf((body: LoginDto) => !body.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+218912345678', description: 'Customer login phone (xor email)' })
  @ValidateIf((body: LoginDto) => !body.email)
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token from login/register response',
  })
  @IsString()
  refreshToken: string;
}

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'مصطفى عيسى' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass456', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  phone: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewPass456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'NewPass456', minLength: 6 })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}

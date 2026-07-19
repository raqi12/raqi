import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

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

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent city ID from GET /cities',
  })
  @IsString()
  cityId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Service area ID from GET /areas?cityId= (must belong to cityId)',
  })
  @IsString()
  areaId: string;

  @ApiProperty({
    example: 32.8872,
    description: 'Initial address latitude (-90 to 90). Required on register.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: 13.1913,
    description: 'Initial address longitude (-180 to 180). Required on register.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    example: 'شارع الجمهورية، بجوار المسجد',
    description: 'Optional street and landmark for the first address',
  })
  @IsOptional()
  @IsString()
  addressDetails?: string;
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
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
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

export class DeactivateAccountDto {
  @ApiProperty({ example: 'CurrentPass123', description: 'Current password confirmation' })
  @IsString()
  password: string;
}

export class DeleteAccountDto {
  @ApiProperty({ example: 'CurrentPass123', description: 'Current password confirmation' })
  @IsString()
  password: string;

  @ApiProperty({ example: '123456', description: 'OTP sent to registered phone' })
  @IsString()
  otp: string;
}

export class ReactivateAccountDto {
  @ApiProperty({ example: '+218912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  password: string;
}

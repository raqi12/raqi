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
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsIn(CUSTOMER_TYPES)
  activityType: (typeof CUSTOMER_TYPES)[number];
}

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  otp: string;

  @IsIn(['register'])
  purpose: 'register';
}

export class LoginDto {
  @ValidateIf((body: LoginDto) => !body.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((body: LoginDto) => !body.email)
  @IsString()
  phone?: string;

  @IsString()
  password: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsString()
  phone: string;
}

export class ResetPasswordDto {
  @IsString()
  phone: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;
}

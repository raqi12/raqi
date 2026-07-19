import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorEnvelopeDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'البريد الإلكتروني مستخدم مسبقاً' })
  message: string | string[];

  @ApiProperty({ example: 'طلب غير صالح' })
  error: string;
}

export class ValidationErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 400,
      message: [
        'البريد الإلكتروني يجب أن يكون بريداً إلكترونياً صالحاً',
        'كلمة المرور يجب أن يكون بطول 6 حرفاً على الأقل',
      ],
      error: 'طلب غير صالح',
    },
  })
  declare message: string | string[];
}

export class BadRequestErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 400,
      message: 'كلمتا المرور غير متطابقتين',
      error: 'طلب غير صالح',
    },
  })
  declare message: string | string[];
}

export class UnauthorizedErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 401,
      message: 'بيانات الدخول غير صحيحة',
      error: 'غير مصرح',
    },
  })
  declare message: string | string[];
}

export class ForbiddenErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 403,
      message: 'مورد محظور',
      error: 'محظور',
    },
  })
  declare message: string | string[];
}

export class NotFoundErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 404,
      message: 'المستخدم غير موجود',
      error: 'غير موجود',
    },
  })
  declare message: string | string[];
}

export class HealthDataDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status: string;

  @ApiProperty({ example: '2026-07-10T18:00:00.000Z' })
  timestamp: string;
}

export class LogoutDataDto {
  @ApiProperty({ example: true })
  loggedOut: boolean;
}

export class MessageDataDto {
  @ApiProperty({ example: true })
  changed?: boolean;

  @ApiProperty({ example: true })
  reset?: boolean;
}

export class OtpSentDataDto {
  @ApiProperty({ example: true })
  otpSent: boolean;

  @ApiProperty({ example: 300, description: 'مدة صلاحية رمز التحقق بالثواني' })
  expiresIn: number;

  @ApiPropertyOptional({
    example: '+218912345678',
    description: 'رقم الهاتف الذي أُرسل إليه رمز التحقق',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'رمز تحقق للاختطوير حتى يتم دمج الرسائل النصية',
  })
  otp?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'اسم بديل لرمز التحقق أثناء التطوير',
  })
  debugOtp?: string;
}

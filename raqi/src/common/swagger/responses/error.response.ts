import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorEnvelopeDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Email already exists' })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

export class ValidationErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({
    example: {
      statusCode: 422,
      message: ['email must be an email', 'password must be longer than or equal to 6 characters'],
      error: 'Unprocessable Entity',
    },
  })
  declare message: string | string[];
}

export class BadRequestErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({ example: { statusCode: 400, message: 'Passwords do not match', error: 'Bad Request' } })
  declare message: string | string[];
}

export class UnauthorizedErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({ example: { statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' } })
  declare message: string | string[];
}

export class ForbiddenErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({ example: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' } })
  declare message: string | string[];
}

export class NotFoundErrorDto extends ErrorEnvelopeDto {
  @ApiProperty({ example: { statusCode: 404, message: 'User not found', error: 'Not Found' } })
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

  @ApiProperty({ example: 300, description: 'OTP validity in seconds' })
  expiresIn: number;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Dev/test OTP returned in API response until SMS is integrated',
  })
  otp?: string;

  @ApiPropertyOptional({ example: '123456', description: 'Alias of otp during dev/testing' })
  debugOtp?: string;
}

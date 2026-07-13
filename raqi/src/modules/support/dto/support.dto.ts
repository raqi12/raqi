import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkingHoursRangeDto {
  @ApiProperty({ example: 'الأحد - الخميس' })
  @IsString()
  label: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '20:00' })
  @IsString()
  endTime: string;
}

export class UpdateSupportSettingsDto {
  @ApiProperty({ example: '920000000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '091xxxxxxxx' })
  @IsString()
  whatsapp: string;

  @ApiProperty({ example: 'support@text.sa' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'text' })
  @IsString()
  twitter: string;

  @ApiProperty({ type: WorkingHoursRangeDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursRangeDto)
  workingHours: WorkingHoursRangeDto[];

  @ApiProperty({
    example:
      'حالة طوارئ: للإبلاغ عن مشاكل عاجلة مثل انسكاب النفايات أو تأخير حرج، اتصل بخط الطوارئ.',
  })
  @IsString()
  emergencyMessage: string;

  @ApiProperty({ example: '920000000' })
  @IsString()
  emergencyPhone: string;

  @ApiProperty({ example: 'v2.4.1' })
  @IsString()
  appVersion: string;

  @ApiProperty({ example: 'يونيو ٢٠٢٦' })
  @IsString()
  lastUpdateLabel: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateFaqDto {
  @ApiProperty({ example: 'كيف يمكنني تغيير موعد الجمع؟' })
  @IsString()
  question: string;

  @ApiProperty({
    example:
      'يمكنك تعديل موعد الجمع من صفحة الاشتراك أو التواصل مع خدمة العملاء.',
  })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ example: 'كيف يمكنني تغيير موعد الجمع؟' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({
    example:
      'يمكنك تعديل موعد الجمع من صفحة الاشتراك أو التواصل مع خدمة العملاء.',
  })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

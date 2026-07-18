import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateContentPageDto {
  @ApiProperty({ example: 'سياسة الخصوصية' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    example: 'نص سياسة الخصوصية الكامل الذي يظهر في التطبيق...',
  })
  @IsString()
  @MinLength(1)
  body: string;
}

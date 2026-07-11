import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({ example: 'حي الأندلس', description: 'Area or neighborhood name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID' })
  @IsString()
  cityId: string;
}

export class UpdateAreaDto {
  @ApiPropertyOptional({ example: 'حي الفتح', description: 'Area or neighborhood name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID' })
  @IsOptional()
  @IsString()
  cityId?: string;
}

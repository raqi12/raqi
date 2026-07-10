import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'مسار حي الأندلس - صباحي', description: 'Route display name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Area MongoDB ID' })
  @IsString()
  areaId: string;

  @ApiPropertyOptional({
    example: ['شارع الجمهورية', 'شارع عمر المختار', 'شارع الفاتح'],
    description: 'Ordered list of stop names along the route',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stops?: string[];
}

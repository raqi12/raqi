import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'طرابلس', description: 'City name' })
  @IsString()
  name: string;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ example: 'بنغازي', description: 'City name' })
  @IsOptional()
  @IsString()
  name?: string;
}

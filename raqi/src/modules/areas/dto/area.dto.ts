import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({ example: 'حي الأندلس', description: 'Area or neighborhood name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'طرابلس', description: 'City name' })
  @IsString()
  city: string;
}

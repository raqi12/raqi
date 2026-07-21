import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBinDto {
  @ApiProperty({ example: 'BIN-240L', description: 'Unique bin type code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 240, minimum: 0, description: 'Bin capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({
    example: 50,
    minimum: 0,
    description: 'Bin fee in LYD added to subscription cost',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiProperty({
    example: 50,
    minimum: 0,
    description: 'Total stock units for this bin type',
  })
  @IsNumber()
  @Min(0)
  totalCount: number;
}

export class UpdateBinDto {
  @ApiPropertyOptional({ example: 360, minimum: 0, description: 'Bin capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({
    example: 50,
    minimum: 0,
    description: 'Bin fee in LYD added to subscription cost',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({
    example: 60,
    minimum: 0,
    description: 'Total stock units (must be >= currently assigned count)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this bin type can be selected',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AssignBinDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Customer MongoDB ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the assignment is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBinDto {
  @ApiProperty({ example: 'BIN-001', description: 'Unique bin identifier code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'QR-BIN-001', description: 'QR code value printed on the bin' })
  @IsString()
  qr: string;

  @ApiPropertyOptional({ example: 240, minimum: 0, description: 'Bin capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;
}

export class UpdateBinDto {
  @ApiPropertyOptional({ example: 360, minimum: 0, description: 'Bin capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({
    enum: ['available', 'assigned', 'maintenance'],
    example: 'available',
    description: 'Current bin status',
  })
  @IsOptional()
  @IsIn(['available', 'assigned', 'maintenance'])
  status?: 'available' | 'assigned' | 'maintenance';
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

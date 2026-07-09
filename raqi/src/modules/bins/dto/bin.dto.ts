import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBinDto {
  @IsString()
  code: string;

  @IsString()
  qr: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;
}

export class UpdateBinDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsIn(['available', 'assigned', 'maintenance'])
  status?: 'available' | 'assigned' | 'maintenance';
}

export class AssignBinDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

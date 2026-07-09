import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  vehicleNumber: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdateDriverStatusDto {
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'customer@example.com', format: 'email', description: 'Customer login email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'أحمد الزاوي', description: 'Customer full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6, description: 'Account password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent city ID (admin: GET /admin/cities)',
  })
  @IsString()
  cityId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Service area ID (admin: GET /admin/areas?cityId=; must belong to cityId)',
  })
  @IsString()
  areaId: string;

  @ApiProperty({
    example: 32.8872,
    description: 'Address latitude (-90 to 90)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: 13.1913,
    description: 'Address longitude (-180 to 180)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'المنزل', description: 'Address label (e.g. home, office)' })
  @IsString()
  label: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID from GET /cities' })
  @IsString()
  cityId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Service area ID from GET /areas?cityId=',
  })
  @IsString()
  areaId: string;

  @ApiProperty({
    example: 32.8872,
    description: 'Address latitude (-90 to 90)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: 13.1913,
    description: 'Address longitude (-180 to 180)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    example: 'شارع الجمهورية، بجوار المسجد',
    description: 'Street and landmark details (may be empty)',
    default: '',
  })
  @IsOptional()
  @IsString()
  details?: string;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'المكتب', description: 'Address label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Parent city ID' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Service area ID' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({
    example: 32.8872,
    description: 'Address latitude (-90 to 90)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: 13.1913,
    description: 'Address longitude (-180 to 180)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: 'شارع عمر المختار، الطابق الثاني', description: 'Street and landmark details' })
  @IsOptional()
  @IsString()
  details?: string;
}

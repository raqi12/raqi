import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CUSTOMER_TYPES } from '../../../common/customer-type';

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

  @ApiPropertyOptional({ enum: CUSTOMER_TYPES, example: 'home', description: 'Customer activity type' })
  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  type?: (typeof CUSTOMER_TYPES)[number];
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ enum: CUSTOMER_TYPES, example: 'commercial', description: 'Customer activity type' })
  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  type?: (typeof CUSTOMER_TYPES)[number];
}

export class CreateAddressDto {
  @ApiProperty({ example: 'المنزل', description: 'Address label (e.g. home, office)' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'حي الأندلس', description: 'Area or neighborhood name' })
  @IsString()
  area: string;

  @ApiProperty({ example: 'شارع الجمهورية، بجوار المسجد', description: 'Street and landmark details' })
  @IsString()
  details: string;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'المكتب', description: 'Address label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'حي الفتح', description: 'Area or neighborhood name' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 'شارع عمر المختار، الطابق الثاني', description: 'Street and landmark details' })
  @IsOptional()
  @IsString()
  details?: string;
}

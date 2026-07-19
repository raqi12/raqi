import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Customer MongoDB ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Plan MongoDB ID' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Customer address MongoDB ID' })
  @IsMongoId()
  addressId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014', description: 'Bin MongoDB ID' })
  @IsOptional()
  @IsString()
  binId?: string;

  @ApiPropertyOptional({ enum: ['unpaid', 'paid'], example: 'unpaid', description: 'Initial payment status' })
  @IsOptional()
  @IsIn(['unpaid', 'paid'])
  paymentStatus?: 'unpaid' | 'paid';
}

export class RequestSubscriptionDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Plan MongoDB ID' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Customer address MongoDB ID' })
  @IsMongoId()
  addressId: string;
}

export class SubscribePlanDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Plan MongoDB ID' })
  @IsMongoId()
  planId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014', description: 'Optional bin MongoDB ID' })
  @IsOptional()
  @IsMongoId()
  binId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Customer address MongoDB ID' })
  @IsMongoId()
  addressId: string;

  @ApiProperty({
    type: [String],
    example: ['2026-07-18', '2026-07-25', '2026-08-01', '2026-08-08'],
    description:
      'Exact collection dates (YYYY-MM-DD). Count must equal plan.numberOfCollections.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    each: true,
    message: 'يجب أن يكون كل تاريخ جمع بصيغة YYYY-MM-DD',
  })
  collectionDates: string[];
}

export class AdminAssignPlanDto extends SubscribePlanDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Customer MongoDB ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: true, description: 'Deduct plan price from customer wallet' })
  @IsOptional()
  @IsBoolean()
  deductWallet?: boolean;
}

export class AssignSubscriptionDriverDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439016', description: 'Driver MongoDB ID' })
  @IsMongoId()
  driverId: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Plan MongoDB ID' })
  @IsOptional()
  @IsMongoId()
  planId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013', description: 'Customer address MongoDB ID' })
  @IsOptional()
  @IsMongoId()
  addressId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014', description: 'Bin MongoDB ID' })
  @IsOptional()
  @IsMongoId()
  binId?: string;

  @ApiPropertyOptional({ enum: ['unpaid', 'paid'], example: 'paid', description: 'Payment status' })
  @IsOptional()
  @IsIn(['unpaid', 'paid'])
  paymentStatus?: 'paid' | 'unpaid';
}

export class UpdateAutoRenewDto {
  @ApiProperty({ example: true, description: 'Enable or disable automatic subscription renewal' })
  @IsBoolean()
  autoRenew: boolean;
}

export class RequestAdditionalCollectionDto {
  @ApiProperty({
    example: '2026-07-22',
    description:
      'Additional collection date (YYYY-MM-DD) within the active subscription period',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'يجب أن يكون تاريخ الجمع بصيغة YYYY-MM-DD',
  })
  collectionDate: string;
}

export class UpdateAdditionalCollectionSettingsDto {
  @ApiProperty({
    example: 25,
    minimum: 0,
    description: 'Fixed price in LYD for one additional collection',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether customers can request additional collections',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReplaceBinDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439014',
    description: 'Available bin MongoDB ID to assign to the subscription',
  })
  @IsMongoId()
  newBinId: string;
}

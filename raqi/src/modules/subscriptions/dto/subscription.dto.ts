import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({ example: '507f1f77bcf86cd799439014', description: 'Bin MongoDB ID' })
  @IsMongoId()
  binId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Customer address MongoDB ID' })
  @IsMongoId()
  addressId: string;
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

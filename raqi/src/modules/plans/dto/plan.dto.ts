import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'باقة شهرية - منزل', description: 'Subscription plan name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 150, minimum: 0, description: 'Plan price in LYD' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: ['weekly', 'monthly', 'custom'], example: 'monthly', description: 'Collection frequency' })
  @IsIn(['weekly', 'monthly', 'custom'])
  frequency: 'weekly' | 'monthly' | 'custom';

  @ApiProperty({ example: 30, minimum: 1, description: 'Plan duration in days' })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ example: 4, minimum: 1, description: 'Number of waste collections included' })
  @IsNumber()
  @Min(1)
  numberOfCollections: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the plan is available for new subscriptions' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'باقة أسبوعية - تجاري', description: 'Subscription plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 75, minimum: 0, description: 'Plan price in LYD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: ['weekly', 'monthly', 'custom'], example: 'weekly', description: 'Collection frequency' })
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'custom'])
  frequency?: 'weekly' | 'monthly' | 'custom';

  @ApiPropertyOptional({ example: 7, minimum: 1, description: 'Plan duration in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Number of waste collections included' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfCollections?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the plan is available for new subscriptions' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SubscriptionCostDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  planId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014', nullable: true })
  binId?: string | null;

  @ApiProperty({ example: 150, description: 'Plan price in LYD' })
  planPrice: number;

  @ApiProperty({ example: 50, description: 'Bin fee in LYD (0 when no bin selected)' })
  binFee: number;

  @ApiProperty({ example: 200, description: 'Total subscription cost in LYD' })
  total: number;
}

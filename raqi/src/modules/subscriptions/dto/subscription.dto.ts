import { IsBoolean, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  binId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsIn(['unpaid', 'paid'])
  paymentStatus?: 'unpaid' | 'paid';
}

export class RequestSubscriptionDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;
}

export class SubscribePlanDto {
  @IsMongoId()
  planId: string;

  @IsMongoId()
  binId: string;

  @IsMongoId()
  addressId: string;
}

export class AdminAssignPlanDto extends SubscribePlanDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsBoolean()
  deductWallet?: boolean;
}

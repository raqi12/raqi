import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsIn(['cash', 'online'])
  method: 'cash' | 'online';
}

export class CreateCustomerPaymentDto {
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

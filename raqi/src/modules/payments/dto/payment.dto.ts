import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Customer MongoDB ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Subscription MongoDB ID' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiProperty({ example: 150, minimum: 0.01, description: 'Payment amount in LYD' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ['cash', 'online'], example: 'cash', description: 'Payment method' })
  @IsIn(['cash', 'online'])
  method: 'cash' | 'online';

  @ApiPropertyOptional({ example: 'تحصيل اشتراك نقداً' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCustomerPaymentDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Subscription MongoDB ID' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiProperty({ example: 150, minimum: 0.01, description: 'Payment amount in LYD' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class ConfirmPaymentDto {
  @ApiPropertyOptional({ example: 'تم تأكيد الدفع من البوابة' })
  @IsOptional()
  @IsString()
  description?: string;
}

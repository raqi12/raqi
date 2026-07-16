import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBankAccountDto {
  @ApiProperty({ example: 'مصرف الجمهورية', description: 'Bank name' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: 'شركة راقي للخدمات البيئية', description: 'Account holder name' })
  @IsString()
  accountHolder: string;

  @ApiProperty({ example: '1234567890', description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional({ example: 'LY82001000000012345678901', description: 'International bank account number (IBAN)' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ example: 'حساب الإيداعات الرئيسي', description: 'Internal notes about the account' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the bank account is active for deposits' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateDepositRequestDto {
  @ApiProperty({ example: 500, minimum: 0.01, description: 'Deposit amount in LYD' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class RejectDepositRequestDto {
  @ApiPropertyOptional({ example: 'إيصال الإيداع غير واضح', description: 'Reason for rejecting the deposit request' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ListDepositRequestsQueryDto {
  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
    description: 'Filter deposit requests by status',
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}

export class AdminCreditWalletDto {
  @ApiProperty({ example: 100, minimum: 0.01, description: 'Credit amount in LYD' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'تعويض عن تأخر الخدمة', description: 'Admin note for the credit' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ListWalletTransactionsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['deposit', 'admin_credit', 'subscription_payment', 'payment', 'refund'],
    example: 'deposit',
  })
  @IsOptional()
  @IsIn(['deposit', 'admin_credit', 'subscription_payment', 'payment', 'refund'])
  type?: 'deposit' | 'admin_credit' | 'subscription_payment' | 'payment' | 'refund';
}

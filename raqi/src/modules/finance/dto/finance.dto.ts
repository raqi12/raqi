import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { WALLET_TRANSACTION_TYPES } from '../../wallets/wallet-transaction.types';

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value == null) {
    return undefined;
  }
  return value;
}

export class FinancePeriodQueryDto {
  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Range start (ISO date). Defaults to the start of the current month.',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.999Z',
    description: 'Range end (ISO date). Defaults to the end of the current month.',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  to?: string;
}

export class FinanceMovementsQueryDto extends FinancePeriodQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: WALLET_TRANSACTION_TYPES,
    example: 'deposit',
    description: 'Filter ledger lines by movement type',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(WALLET_TRANSACTION_TYPES)
  type?: (typeof WALLET_TRANSACTION_TYPES)[number];
}

export class FinancePositionDto {
  @ApiProperty({ example: 12500 })
  walletFunds: number;

  @ApiProperty({ example: 40 })
  walletCount: number;

  @ApiProperty({ example: 8600 })
  activeSubscriptionFunds: number;

  @ApiProperty({ example: 18 })
  activeSubscriptionCount: number;

  @ApiProperty({
    example: 1,
    description: 'Active subscriptions with no linked plan price',
  })
  unpricedCount: number;

  @ApiProperty({ example: '2026-09-26T05:00:00.000Z' })
  generatedAt: string;
}

export class FinanceStatementLineDto {
  @ApiProperty({ example: 'deposit' })
  type: string;

  @ApiProperty({ example: 'credit', enum: ['credit', 'debit'] })
  direction: string;

  @ApiProperty({ example: 12 })
  count: number;

  @ApiProperty({ example: 3400 })
  total: number;
}

export class FinanceStatementDto {
  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  from: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.999Z' })
  to: string;

  @ApiProperty({ example: 5000 })
  moneyIn: number;

  @ApiProperty({ example: 1800 })
  moneyOut: number;

  @ApiProperty({ example: 3200 })
  net: number;

  @ApiProperty({ type: FinanceStatementLineDto, isArray: true })
  byType: FinanceStatementLineDto[];
}

export class FinanceMovementDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({ example: 'subscription_payment' })
  type: string;

  @ApiProperty({ example: 'debit', enum: ['credit', 'debit'] })
  direction: string;

  @ApiProperty({ example: 150 })
  amount: number;

  @ApiProperty({ example: 400 })
  balanceBefore: number;

  @ApiProperty({ example: 250 })
  balanceAfter: number;

  @ApiProperty({ example: 'subscription', nullable: true })
  referenceType: string | null;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', nullable: true })
  referenceId: string | null;

  @ApiProperty({ example: 'دفع اشتراك', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-09-12T10:00:00.000Z' })
  createdAt: string;
}

export class FinanceMovementsDto {
  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  from: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.999Z' })
  to: string;

  @ApiProperty({ type: FinanceMovementDto, isArray: true })
  items: FinanceMovementDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

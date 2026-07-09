import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBankAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  accountHolder: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateDepositRequestDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class RejectDepositRequestDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ListDepositRequestsQueryDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}

export class AdminCreditWalletDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsIn(['weekly', 'monthly', 'custom'])
  frequency: 'weekly' | 'monthly' | 'custom';

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsNumber()
  @Min(1)
  numberOfCollections: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'custom'])
  frequency?: 'weekly' | 'monthly' | 'custom';

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfCollections?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

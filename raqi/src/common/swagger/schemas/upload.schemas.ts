import { ApiProperty } from '@nestjs/swagger';

export class DepositEvidenceUploadDto {
  @ApiProperty({
    type: 'number',
    minimum: 0.01,
    example: 500,
    description: 'Deposit amount in local currency',
  })
  amount: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Transfer evidence image (jpg, jpeg, png, webp). Max 5MB.',
  })
  evidence: string;
}

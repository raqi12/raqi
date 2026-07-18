import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class GalleryImageUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Gallery image (jpg, jpeg, png, webp). Max 5MB.',
  })
  image: string;
}

export class GalleryCreateWithImageDto {
  @ApiProperty({ example: 'خدمة الجمع المنزلي' })
  title: string;

  @ApiPropertyOptional({ example: 'جمع النفايات من المنازل أسبوعياً' })
  caption?: string;

  @ApiPropertyOptional({ example: 'https://raqii.com.ly' })
  linkUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  active?: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Gallery image (jpg, jpeg, png, webp). Max 5MB.',
  })
  image: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: 'خدمة الجمع المنزلي' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    example: '/uploads/gallery/abc.jpg',
    description: 'Public image URL (use POST /admin/gallery/upload to upload a file)',
  })
  @IsString()
  @MinLength(1)
  imageUrl: string;

  @ApiPropertyOptional({ example: 'جمع النفايات من المنازل أسبوعياً' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 'https://raqii.com.ly' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateGalleryDto {
  @ApiPropertyOptional({ example: 'خدمة الجمع التجاري' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ example: '/uploads/gallery/abc.jpg' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'جمع النفايات من المنشآت التجارية' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 'https://raqii.com.ly' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateGalleryMultipartDto {
  @ApiProperty({ example: 'خدمة الجمع المنزلي' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ example: 'جمع النفايات من المنازل أسبوعياً' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 'https://raqii.com.ly' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

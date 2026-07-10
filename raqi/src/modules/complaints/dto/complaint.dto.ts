import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({ example: 'تأخر في جمع النفايات', description: 'Complaint subject line' })
  @IsString()
  subject: string;

  @ApiProperty({
    example: 'لم يتم جمع النفايات منذ ثلاثة أيام رغم الاشتراك في الباقة الشهرية.',
    description: 'Detailed complaint description',
  })
  @IsString()
  body: string;
}

export class UpdateComplaintDto {
  @ApiPropertyOptional({
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    example: 'in_progress',
    description: 'Complaint workflow status',
  })
  @IsOptional()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Staff user ID assigned to handle the complaint' })
  @IsOptional()
  @IsString()
  assignee?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../ticket.enums';

export class CreateTicketDto {
  @ApiProperty({ example: 'مشكلة في جمع النفايات', description: 'Ticket subject' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiProperty({
    example: 'لم يتم الجمع منذ 3 أيام في عنواني',
    description: 'Initial ticket description',
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiPropertyOptional({
    enum: TICKET_PRIORITIES,
    example: 'medium',
    description: 'Ticket priority',
  })
  @IsOptional()
  @IsIn(TICKET_PRIORITIES)
  priority?: (typeof TICKET_PRIORITIES)[number];
}

export class UpdateTicketDto {
  @ApiPropertyOptional({
    enum: TICKET_STATUSES,
    example: 'in_progress',
    description: 'Ticket workflow status',
  })
  @IsOptional()
  @IsIn(TICKET_STATUSES)
  status?: (typeof TICKET_STATUSES)[number];

  @ApiPropertyOptional({
    enum: TICKET_PRIORITIES,
    example: 'high',
    description: 'Ticket priority',
  })
  @IsOptional()
  @IsIn(TICKET_PRIORITIES)
  priority?: (typeof TICKET_PRIORITIES)[number];

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Admin user id assigned to the ticket',
  })
  @IsOptional()
  @IsMongoId()
  assigneeId?: string;
}

export class CreateTicketMessageDto {
  @ApiProperty({ example: 'شكراً، سنراجع الأمر', description: 'Message body' })
  @IsString()
  @MinLength(1)
  body: string;
}

export class ListTicketsQueryDto {
  @ApiPropertyOptional({ enum: TICKET_STATUSES, example: 'open' })
  @IsOptional()
  @IsIn(TICKET_STATUSES)
  status?: (typeof TICKET_STATUSES)[number];

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES, example: 'high' })
  @IsOptional()
  @IsIn(TICKET_PRIORITIES)
  priority?: (typeof TICKET_PRIORITIES)[number];

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 'جمع' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ListTicketMessagesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class JoinTicketDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  ticketId: string;
}

export class SendTicketMessageSocketDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  ticketId: string;

  @ApiProperty({ example: 'تم استلام طلبك' })
  @IsString()
  @MinLength(1)
  body: string;
}

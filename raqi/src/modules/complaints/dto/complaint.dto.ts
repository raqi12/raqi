import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateComplaintDto {
  @IsString()
  subject: string;

  @IsString()
  body: string;
}

export class UpdateComplaintDto {
  @IsOptional()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';

  @IsOptional()
  @IsString()
  assignee?: string;
}

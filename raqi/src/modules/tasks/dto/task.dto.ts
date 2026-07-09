import { IsOptional, IsString } from 'class-validator';

export class GenerateTasksDto {
  @IsString()
  date: string;

  @IsString()
  areaId: string;
}

export class AssignTaskDto {
  @IsString()
  driverId: string;
}

export class CompleteTaskDto {
  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SkipTaskDto {
  @IsString()
  reason: string;

  @IsString()
  location: string;
}

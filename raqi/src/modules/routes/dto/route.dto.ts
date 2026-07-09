import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsString()
  areaId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stops?: string[];
}

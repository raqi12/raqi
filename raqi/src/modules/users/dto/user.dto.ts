import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  DASHBOARD_PAGE_PERMISSIONS,
  type DashboardPagePermission,
} from '../../../common/dashboard-permissions';
import { Role } from '../../../common/roles.enum';

const STAFF_CREATE_ROLES = [Role.Admin, Role.Manager, Role.Supervisor] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'manager@raqi.local', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'أحمد المدير' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: STAFF_CREATE_ROLES,
    example: Role.Supervisor,
    description: 'Staff role: admin, manager, or supervisor',
  })
  @IsIn(STAFF_CREATE_ROLES)
  role: (typeof STAFF_CREATE_ROLES)[number];

  @ApiPropertyOptional({
    type: [String],
    enum: DASHBOARD_PAGE_PERMISSIONS,
    example: ['customers', 'subscriptions', 'tasks'],
    description: 'Dashboard pages this user can manage',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn([...DASHBOARD_PAGE_PERMISSIONS], { each: true })
  permissions?: DashboardPagePermission[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'أحمد المدير المحدث' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'manager@raqi.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    enum: STAFF_CREATE_ROLES,
    example: Role.Supervisor,
  })
  @IsOptional()
  @IsIn(STAFF_CREATE_ROLES)
  role?: (typeof STAFF_CREATE_ROLES)[number];

  @ApiPropertyOptional({
    type: [String],
    enum: DASHBOARD_PAGE_PERMISSIONS,
    example: ['customers', 'drivers'],
    description: 'Replace dashboard page permissions',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn([...DASHBOARD_PAGE_PERMISSIONS], { each: true })
  permissions?: DashboardPagePermission[];
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

export class UpdateUserPermissionsDto {
  @ApiProperty({
    type: [String],
    enum: DASHBOARD_PAGE_PERMISSIONS,
    example: ['customers', 'subscriptions', 'tasks'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn([...DASHBOARD_PAGE_PERMISSIONS], { each: true })
  permissions: DashboardPagePermission[];
}

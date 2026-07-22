import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './auth-user.interface';
import { ROLES_KEY } from './roles.decorator';
import { isStaffRole, Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser | undefined }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('You do not have enough permissions');
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Admin-only routes are also available to managers/supervisors
    // (page-level access is enforced in the dashboard UI via permissions).
    if (
      requiredRoles.includes(Role.Admin) &&
      isStaffRole(user.role) &&
      user.role !== Role.Driver &&
      user.role !== Role.Customer
    ) {
      return true;
    }

    throw new ForbiddenException('You do not have enough permissions');
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './auth-user.interface';
import {
  ADMIN_NOTIFICATION_PERMISSIONS,
  type NotificationPermission,
} from './permissions';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Role } from './roles.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<NotificationPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser | undefined }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('You do not have enough permissions');
    }

    const granted =
      user.role === Role.Admin ? ADMIN_NOTIFICATION_PERMISSIONS : [];

    const ok = required.every((permission) => granted.includes(permission));
    if (!ok) {
      throw new ForbiddenException('You do not have enough permissions');
    }
    return true;
  }
}

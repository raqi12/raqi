import { SetMetadata } from '@nestjs/common';
import type { NotificationPermission } from './permissions';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: NotificationPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const NOTIFICATION_PERMISSIONS = [
  'notifications.view',
  'notifications.create',
  'notifications.send',
  'notifications.update',
  'notifications.delete',
  'notifications.analytics',
] as const;

export type NotificationPermission =
  (typeof NOTIFICATION_PERMISSIONS)[number];

export const ADMIN_NOTIFICATION_PERMISSIONS: NotificationPermission[] = [
  ...NOTIFICATION_PERMISSIONS,
];

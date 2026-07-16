export const NOTIFICATION_TYPES = [
  'system',
  'announcement',
  'ticket',
  'task',
  'subscription',
  'payment',
  'user',
  'message',
  'custom',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CATEGORIES = [
  'general',
  'operations',
  'billing',
  'support',
  'security',
  'marketing',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_PRIORITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_TARGET_TYPES = [
  'user',
  'role',
  'all',
] as const;

export type NotificationTargetType = (typeof NOTIFICATION_TARGET_TYPES)[number];

export const NOTIFICATION_LOG_STATUSES = [
  'pending',
  'processing',
  'sent',
  'delivered',
  'opened',
  'failed',
] as const;

export type NotificationLogStatus = (typeof NOTIFICATION_LOG_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ['in_app', 'push'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const DEVICE_TYPES = ['ios', 'android', 'web'] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const SCHEDULED_NOTIFICATION_STATUSES = [
  'draft',
  'scheduled',
  'sent',
  'cancelled',
] as const;

export type ScheduledNotificationStatus =
  (typeof SCHEDULED_NOTIFICATION_STATUSES)[number];

export const DEFAULT_TEMPLATE_CODES = [
  'TICKET_CREATED',
  'TICKET_REPLIED',
  'TICKET_CLOSED',
  'TICKET_ASSIGNED',
  'TASK_ASSIGNED',
  'TASK_COMPLETED',
  'TASK_SKIPPED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_SUSPENDED',
  'DRIVER_ASSIGNED',
  'PAYMENT_RECEIVED',
  'USER_REGISTERED',
  'PASSWORD_RESET',
] as const;

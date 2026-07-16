import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  DEFAULT_TEMPLATE_CODES,
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationPriority,
  type NotificationType,
} from './notification.enums';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';
import {
  NotificationLog,
  NotificationLogDocument,
} from './schemas/notification-log.schema';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import {
  NotificationTemplate,
  NotificationTemplateDocument,
} from './schemas/notification-template.schema';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  ScheduledNotification,
  ScheduledNotificationDocument,
} from './schemas/scheduled-notification.schema';
import { FirebasePushService } from './firebase-push.service';
import type {
  AnalyticsQueryDto,
  ListNotificationsQueryDto,
  ScheduleNotificationDto,
  SendNotificationDto,
  UpdatePreferencesDto,
  UpdateScheduledNotificationDto,
  UpdateTemplateDto,
  CreateTemplateDto,
} from './dto/notification.dto';

export type SendPayload = {
  title: string;
  body: string;
  image?: string | null;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string | null;
  scheduledNotificationId?: string | null;
  userIds: string[];
  targetType?: 'user' | 'role' | 'all';
  targetId?: string | null;
};

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private gatewayEmitter:
    | {
        emitToUser: (
          userId: string,
          event: string,
          payload: unknown,
        ) => void;
      }
    | null = null;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationTemplate.name)
    private readonly templateModel: Model<NotificationTemplateDocument>,
    @InjectModel(NotificationLog.name)
    private readonly logModel: Model<NotificationLogDocument>,
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(ScheduledNotification.name)
    private readonly scheduledModel: Model<ScheduledNotificationDocument>,
    @InjectModel(NotificationPreference.name)
    private readonly preferenceModel: Model<NotificationPreferenceDocument>,
    private readonly firebasePushService: FirebasePushService,
    private readonly usersService: UsersService,
  ) {}

  onModuleInit() {
    void this.seedTemplates();
  }

  setGatewayEmitter(emitter: {
    emitToUser: (userId: string, event: string, payload: unknown) => void;
  }) {
    this.gatewayEmitter = emitter;
  }

  private emitRealtime(userId: string, event: string, payload: unknown) {
    this.gatewayEmitter?.emitToUser(userId, event, payload);
  }

  // ——— Inbox ———

  async listForUser(userId: string, query: ListNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = { userId };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (typeof query.isRead === 'boolean') filter.isRead = query.isRead;
    if (query.search) {
      const pattern = new RegExp(query.search, 'i');
      filter.$or = [{ title: pattern }, { body: pattern }];
    }

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId, isRead: false })
      .exec();
  }

  async markRead(id: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (String(notification.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    await this.logModel
      .updateMany(
        { notificationId: id, channel: 'push', status: 'delivered' },
        { status: 'opened', openedAt: new Date() },
      )
      .exec();
    const count = await this.unreadCount(userId);
    this.emitRealtime(userId, 'notification_read', {
      id: String(notification.id),
      unreadCount: count,
    });
    this.emitRealtime(userId, 'unread_count', { count });
    return notification;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
    this.emitRealtime(userId, 'unread_count', { count: 0 });
    return result.modifiedCount;
  }

  async deleteForUser(id: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (String(notification.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }
    await this.notificationModel.findByIdAndDelete(id).exec();
    const count = await this.unreadCount(userId);
    this.emitRealtime(userId, 'unread_count', { count });
  }

  async bulkDeleteForUser(ids: string[], userId: string): Promise<number> {
    const result = await this.notificationModel
      .deleteMany({ _id: { $in: ids }, userId })
      .exec();
    const count = await this.unreadCount(userId);
    this.emitRealtime(userId, 'unread_count', { count });
    return result.deletedCount;
  }

  // ——— Devices ———

  async registerDevice(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android' | 'web',
  ) {
    return this.deviceTokenModel
      .findOneAndUpdate(
        { userId, token },
        {
          userId,
          token,
          deviceType,
          isActive: true,
          lastUsedAt: new Date(),
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async removeDevice(userId: string, token: string) {
    await this.deviceTokenModel
      .updateMany({ userId, token }, { isActive: false })
      .exec();
  }

  // ——— Preferences ———

  async getPreferences(userId: string) {
    const existing = await this.preferenceModel.findOne({ userId }).exec();
    if (existing) return existing;
    return this.preferenceModel.create({
      userId,
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      categories: NOTIFICATION_CATEGORIES.map((category) => ({
        category,
        inApp: true,
        push: true,
        email: false,
      })),
    });
  }

  async updatePreferences(userId: string, patch: UpdatePreferencesDto) {
    const current = await this.getPreferences(userId);
    if (patch.enabled !== undefined) current.enabled = patch.enabled;
    if (patch.pushEnabled !== undefined) current.pushEnabled = patch.pushEnabled;
    if (patch.emailEnabled !== undefined) current.emailEnabled = patch.emailEnabled;
    if (patch.categories) current.categories = patch.categories;
    return current.save();
  }

  private async allowsChannel(
    userId: string,
    category: NotificationCategory,
    channel: 'in_app' | 'push',
  ): Promise<boolean> {
    const pref = await this.getPreferences(userId);
    if (!pref.enabled) return false;
    if (channel === 'push' && !pref.pushEnabled) return false;
    const cat = pref.categories?.find((item) => item.category === category);
    if (!cat) return true;
    return channel === 'in_app' ? cat.inApp : cat.push;
  }

  // ——— Send pipeline ———

  async resolveAudience(dto: SendNotificationDto): Promise<string[]> {
    const audience = dto.audience ?? (dto.userId ? 'user' : 'all');
    if (audience === 'user') {
      if (!dto.userId) throw new BadRequestException('userId is required');
      return [dto.userId];
    }
    if (audience === 'users') {
      if (!dto.userIds?.length) {
        throw new BadRequestException('userIds is required');
      }
      return [...new Set(dto.userIds)];
    }
    if (audience === 'role') {
      if (!dto.role) throw new BadRequestException('role is required');
      const users = await this.usersService.findAll();
      return users
        .filter((user) => user.role === dto.role && user.status === 'active')
        .map((user) => String(user.id));
    }
    if (audience === 'roles') {
      const roles = dto.roles?.length
        ? dto.roles
        : dto.role
          ? [dto.role]
          : [];
      if (!roles.length) {
        throw new BadRequestException('roles is required');
      }
      const roleSet = new Set(roles);
      const users = await this.usersService.findAll();
      return users
        .filter((user) => roleSet.has(user.role) && user.status === 'active')
        .map((user) => String(user.id));
    }
    const users = await this.usersService.findAll();
    return users
      .filter((user) => user.status === 'active')
      .map((user) => String(user.id));
  }

  async send(dto: SendNotificationDto, options?: { scheduledNotificationId?: string }) {
    const userIds = await this.resolveAudience(dto);
    return this.deliverToUsers({
      title: dto.title,
      body: dto.body,
      image: dto.image ?? null,
      type: dto.type ?? 'announcement',
      category: dto.category ?? 'general',
      priority: dto.priority ?? 'medium',
      referenceType: dto.referenceType ?? null,
      referenceId: dto.referenceId ?? null,
      actionUrl: dto.actionUrl ?? null,
      scheduledNotificationId: options?.scheduledNotificationId ?? null,
      userIds,
      targetType:
        dto.audience === 'role' || dto.audience === 'roles'
          ? 'role'
          : dto.audience === 'all'
            ? 'all'
            : 'user',
      targetId:
        dto.userId ??
        dto.role ??
        (dto.roles?.length ? dto.roles.join(',') : null),
    });
  }

  async deliverToUsers(payload: SendPayload) {
    const created: NotificationDocument[] = [];
    for (const userId of payload.userIds) {
      const category = payload.category ?? 'general';
      const allowInApp = await this.allowsChannel(userId, category, 'in_app');
      if (!allowInApp) continue;

      const notification = await this.notificationModel.create({
        userId,
        title: payload.title,
        body: payload.body,
        image: payload.image ?? null,
        type: payload.type ?? 'system',
        category,
        priority: payload.priority ?? 'medium',
        targetType: payload.targetType ?? 'user',
        targetId: payload.targetId ?? userId,
        referenceType: payload.referenceType ?? null,
        referenceId: payload.referenceId ?? null,
        actionUrl: payload.actionUrl ?? null,
        scheduledNotificationId: payload.scheduledNotificationId ?? null,
        isRead: false,
        isSent: true,
        sentAt: new Date(),
        readAt: null,
      });
      created.push(notification);

      await this.logModel.create({
        notificationId: String(notification.id),
        userId,
        channel: 'in_app',
        status: 'sent',
        deliveredAt: new Date(),
      });

      const unread = await this.unreadCount(userId);
      this.emitRealtime(userId, 'notification_created', notification);
      this.emitRealtime(userId, 'unread_count', { count: unread });

      void this.sendPushForNotification(notification);
    }
    return { count: created.length, notifications: created };
  }

  private async sendPushForNotification(notification: NotificationDocument) {
    const allowPush = await this.allowsChannel(
      notification.userId,
      notification.category,
      'push',
    );
    if (!allowPush || !this.firebasePushService.isEnabled()) return;

    const devices = await this.deviceTokenModel
      .find({ userId: notification.userId, isActive: true })
      .exec();
    if (!devices.length) return;

    const log = await this.logModel.create({
      notificationId: String(notification.id),
      userId: notification.userId,
      channel: 'push',
      status: 'processing',
    });

    const result = await this.firebasePushService.sendToTokens(
      devices.map((d) => d.token),
      {
        title: notification.title,
        body: notification.body,
        image: notification.image,
        data: {
          notificationId: String(notification.id),
          type: notification.type,
          category: notification.category,
          referenceType: notification.referenceType ?? '',
          referenceId: notification.referenceId ?? '',
          actionUrl: notification.actionUrl ?? '',
        },
      },
    );

    if (result.invalidTokens.length) {
      await this.deviceTokenModel
        .updateMany(
          { token: { $in: result.invalidTokens } },
          { isActive: false },
        )
        .exec();
    }

    log.status = result.successCount > 0 ? 'delivered' : 'failed';
    log.deliveredAt = result.successCount > 0 ? new Date() : null;
    log.errorMessage =
      result.failureCount > 0
        ? `failures=${result.failureCount}`
        : null;
    await log.save();
  }

  async notifyFromTemplate(
    code: string,
    userIds: string[],
    variables: Record<string, string>,
    extras?: Partial<SendPayload>,
  ) {
    const template = await this.templateModel
      .findOne({ code, isActive: true })
      .exec();
    if (!template) {
      this.logger.warn(`Template ${code} not found; skipping`);
      return { count: 0, notifications: [] };
    }
    const title = this.interpolate(template.titleTemplate, variables);
    const body = this.interpolate(template.bodyTemplate, variables);
    return this.deliverToUsers({
      title,
      body,
      type: extras?.type ?? template.type,
      category: extras?.category ?? template.category,
      priority: extras?.priority ?? 'medium',
      referenceType: extras?.referenceType ?? null,
      referenceId: extras?.referenceId ?? null,
      actionUrl: extras?.actionUrl ?? null,
      userIds,
      targetType: 'user',
    });
  }

  interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
  }

  // ——— Templates ———

  listTemplates() {
    return this.templateModel.find().sort({ code: 1 }).exec();
  }

  async createTemplate(dto: CreateTemplateDto) {
    return this.templateModel.create({
      ...dto,
      variables: dto.variables ?? [],
      type: dto.type ?? 'system',
      category: dto.category ?? 'general',
      isActive: dto.isActive ?? true,
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const updated = await this.templateModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Template not found');
    return updated;
  }

  async deleteTemplate(id: string) {
    const deleted = await this.templateModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Template not found');
    return deleted;
  }

  private async seedTemplates() {
    const seeds: Array<{
      code: string;
      name: string;
      titleTemplate: string;
      bodyTemplate: string;
      variables: string[];
      type: NotificationType;
      category: NotificationCategory;
    }> = [
      {
        code: 'TICKET_CREATED',
        name: 'Ticket created',
        titleTemplate: 'تذكرة جديدة {{ticketNumber}}',
        bodyTemplate: 'تم إنشاء تذكرة دعم: {{subject}}',
        variables: ['ticketNumber', 'subject'],
        type: 'ticket',
        category: 'support',
      },
      {
        code: 'TICKET_REPLIED',
        name: 'Ticket replied',
        titleTemplate: 'رد على التذكرة {{ticketNumber}}',
        bodyTemplate: 'يوجد رد جديد على تذكرتك.',
        variables: ['ticketNumber'],
        type: 'ticket',
        category: 'support',
      },
      {
        code: 'TICKET_CLOSED',
        name: 'Ticket closed',
        titleTemplate: 'تم إغلاق التذكرة {{ticketNumber}}',
        bodyTemplate: 'تم إغلاق تذكرة الدعم الخاصة بك.',
        variables: ['ticketNumber'],
        type: 'ticket',
        category: 'support',
      },
      {
        code: 'TICKET_ASSIGNED',
        name: 'Ticket assigned',
        titleTemplate: 'تعيين تذكرة {{ticketNumber}}',
        bodyTemplate: 'تم تعيين تذكرة دعم إليك.',
        variables: ['ticketNumber'],
        type: 'ticket',
        category: 'support',
      },
      {
        code: 'TASK_ASSIGNED',
        name: 'Task assigned',
        titleTemplate: 'مهمة جديدة',
        bodyTemplate: 'تم تعيين مهمة جمع بتاريخ {{scheduledDate}}.',
        variables: ['scheduledDate'],
        type: 'task',
        category: 'operations',
      },
      {
        code: 'TASK_COMPLETED',
        name: 'Task completed',
        titleTemplate: 'اكتملت مهمة الجمع',
        bodyTemplate: 'تم تأكيد جمع النفايات بتاريخ {{scheduledDate}}.',
        variables: ['scheduledDate'],
        type: 'task',
        category: 'operations',
      },
      {
        code: 'TASK_SKIPPED',
        name: 'Task skipped',
        titleTemplate: 'مشكلة في مهمة الجمع',
        bodyTemplate: 'تعذر إكمال الجمع: {{reason}}',
        variables: ['reason', 'scheduledDate'],
        type: 'task',
        category: 'operations',
      },
      {
        code: 'SUBSCRIPTION_ACTIVATED',
        name: 'Subscription activated',
        titleTemplate: 'تم تفعيل الاشتراك',
        bodyTemplate: 'اشتراكك أصبح نشطاً الآن.',
        variables: [],
        type: 'subscription',
        category: 'billing',
      },
      {
        code: 'SUBSCRIPTION_SUSPENDED',
        name: 'Subscription suspended',
        titleTemplate: 'تم إيقاف الاشتراك',
        bodyTemplate: 'تم إيقاف اشتراكك. يرجى المراجعة.',
        variables: [],
        type: 'subscription',
        category: 'billing',
      },
      {
        code: 'DRIVER_ASSIGNED',
        name: 'Driver assigned',
        titleTemplate: 'تم تعيين سائق',
        bodyTemplate: 'تم ربط سائق باشتراكك.',
        variables: [],
        type: 'subscription',
        category: 'operations',
      },
      {
        code: 'PAYMENT_RECEIVED',
        name: 'Payment received',
        titleTemplate: 'تم استلام دفعة',
        bodyTemplate: 'تم تسجيل دفعة بقيمة {{amount}} د.ل.',
        variables: ['amount'],
        type: 'payment',
        category: 'billing',
      },
      {
        code: 'USER_REGISTERED',
        name: 'User registered',
        titleTemplate: 'مرحباً بك في راقي',
        bodyTemplate: 'تم إنشاء حسابك بنجاح.',
        variables: [],
        type: 'user',
        category: 'security',
      },
      {
        code: 'PASSWORD_RESET',
        name: 'Password reset',
        titleTemplate: 'إعادة تعيين كلمة المرور',
        bodyTemplate: 'تم طلب إعادة تعيين كلمة المرور لحسابك.',
        variables: [],
        type: 'user',
        category: 'security',
      },
    ];

    for (const seed of seeds) {
      if (!DEFAULT_TEMPLATE_CODES.includes(seed.code as (typeof DEFAULT_TEMPLATE_CODES)[number])) {
        continue;
      }
      await this.templateModel
        .updateOne({ code: seed.code }, { $setOnInsert: seed }, { upsert: true })
        .exec();
    }
  }

  // ——— Scheduled ———

  listScheduled() {
    return this.scheduledModel.find().sort({ scheduledAt: -1 }).exec();
  }

  async createScheduled(dto: ScheduleNotificationDto, createdBy: string) {
    const roles =
      dto.roles?.length ? dto.roles : dto.role ? [dto.role] : [];
    return this.scheduledModel.create({
      title: dto.title,
      body: dto.body,
      image: dto.image ?? null,
      type: dto.type ?? 'announcement',
      category: dto.category ?? 'general',
      priority: dto.priority ?? 'medium',
      targetType:
        dto.audience === 'role' || dto.audience === 'roles'
          ? 'role'
          : dto.audience === 'all'
            ? 'all'
            : 'user',
      targetId:
        dto.userId ??
        dto.role ??
        (roles.length ? roles.join(',') : null),
      userIds: dto.userIds ?? (dto.userId ? [dto.userId] : []),
      targetRole: dto.role ?? roles[0] ?? null,
      targetRoles: roles,
      referenceType: dto.referenceType ?? null,
      referenceId: dto.referenceId ?? null,
      actionUrl: dto.actionUrl ?? null,
      scheduledAt: new Date(dto.scheduledAt),
      status: dto.status ?? 'scheduled',
      createdBy,
    });
  }

  async updateScheduled(id: string, dto: UpdateScheduledNotificationDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.scheduledAt) patch.scheduledAt = new Date(dto.scheduledAt);
    const updated = await this.scheduledModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Scheduled notification not found');
    return updated;
  }

  async cancelScheduled(id: string) {
    return this.updateScheduled(id, { status: 'cancelled' });
  }

  async processDueSchedules() {
    const due = await this.scheduledModel
      .find({
        status: 'scheduled',
        scheduledAt: { $lte: new Date() },
      })
      .exec();

    for (const item of due) {
      try {
        const targetRoles =
          item.targetRoles?.length
            ? item.targetRoles
            : item.targetRole
              ? [item.targetRole]
              : [];
        const audience =
          item.targetType === 'all'
            ? 'all'
            : targetRoles.length > 1
              ? 'roles'
              : targetRoles.length === 1
                ? 'role'
                : item.userIds.length > 1
                  ? 'users'
                  : 'user';
        await this.send(
          {
            title: item.title,
            body: item.body,
            image: item.image ?? undefined,
            type: item.type,
            category: item.category,
            priority: item.priority,
            audience,
            userId: item.userIds[0],
            userIds: item.userIds,
            role: targetRoles[0],
            roles: targetRoles.length > 1 ? targetRoles : undefined,
            referenceType: item.referenceType ?? undefined,
            referenceId: item.referenceId ?? undefined,
            actionUrl: item.actionUrl ?? undefined,
          },
          { scheduledNotificationId: String(item.id) },
        );
        item.status = 'sent';
        await item.save();
      } catch (error) {
        this.logger.error(`Failed scheduled notification ${item.id}`, error);
      }
    }
    return due.length;
  }

  // ——— Admin list/get/delete ———

  async adminList(query: ListNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (typeof query.isRead === 'boolean') filter.isRead = query.isRead;
    if (query.search) {
      const pattern = new RegExp(query.search, 'i');
      filter.$or = [{ title: pattern }, { body: pattern }];
    }
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);
    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async adminGet(id: string) {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) throw new NotFoundException('Notification not found');
    const logs = await this.logModel
      .find({ notificationId: id })
      .sort({ createdAt: -1 })
      .exec();
    return { notification, logs };
  }

  async adminDelete(id: string) {
    const deleted = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Notification not found');
    return deleted;
  }

  async adminBulkDelete(ids: string[]) {
    const result = await this.notificationModel
      .deleteMany({ _id: { $in: ids } })
      .exec();
    return result.deletedCount;
  }

  // ——— Analytics ———

  async analytics(query: AnalyticsQueryDto) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 86400000);
    const to = query.to ? new Date(query.to) : new Date();
    const match: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: to },
    };

    const notifMatch: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: to },
    };
    if (query.type) notifMatch.type = query.type;

    let userIdsFilter: string[] | null = null;
    if (query.role) {
      const users = await this.usersService.findAll();
      userIdsFilter = users
        .filter((u) => u.role === query.role)
        .map((u) => String(u.id));
      notifMatch.userId = { $in: userIdsFilter };
      match.userId = { $in: userIdsFilter };
    }

    const [totalSent, logs] = await Promise.all([
      this.notificationModel.countDocuments(notifMatch).exec(),
      this.logModel.find(match).exec(),
    ]);

    const totalDelivered = logs.filter((l) =>
      ['delivered', 'opened', 'sent'].includes(l.status),
    ).length;
    const totalOpened = logs.filter((l) => l.status === 'opened').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const deliveryRate =
      totalSent === 0 ? 0 : Math.round((totalDelivered / totalSent) * 100);
    const openRate =
      totalDelivered === 0 ? 0 : Math.round((totalOpened / totalDelivered) * 100);

    const granularity = query.granularity ?? 'day';
    const seriesMap = new Map<string, { sent: number; delivered: number; opened: number }>();

    const notifications = await this.notificationModel.find(notifMatch).exec();
    for (const n of notifications) {
      const key = this.bucketKey(
        (n as NotificationDocument & { createdAt?: Date }).createdAt ?? new Date(),
        granularity,
      );
      const bucket = seriesMap.get(key) ?? { sent: 0, delivered: 0, opened: 0 };
      bucket.sent += 1;
      seriesMap.set(key, bucket);
    }
    for (const log of logs) {
      const key = this.bucketKey(
        (log as NotificationLogDocument & { createdAt?: Date }).createdAt ??
          new Date(),
        granularity,
      );
      const bucket = seriesMap.get(key) ?? { sent: 0, delivered: 0, opened: 0 };
      if (['delivered', 'opened', 'sent'].includes(log.status)) {
        bucket.delivered += 1;
      }
      if (log.status === 'opened') bucket.opened += 1;
      seriesMap.set(key, bucket);
    }

    const series = [...seriesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      failed,
      deliveryRate,
      openRate,
      series,
      firebaseEnabled: this.firebasePushService.isEnabled(),
    };
  }

  private bucketKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    if (granularity === 'month') return `${y}-${m}`;
    if (granularity === 'week') {
      const start = new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate()));
      const day = start.getUTCDay() || 7;
      start.setUTCDate(start.getUTCDate() - day + 1);
      return start.toISOString().slice(0, 10);
    }
    return `${y}-${m}-${d}`;
  }
}

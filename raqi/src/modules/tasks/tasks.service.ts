import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AreasService } from '../areas/areas.service';
import { BinsService } from '../bins/bins.service';
import { CustomersService } from '../customers/customers.service';
import { DriversService } from '../drivers/drivers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SupportSettingsService } from '../support/support-settings.service';
import { DEFAULT_WORKING_HOURS } from '../support/support.defaults';
import {
  addDays,
  startOfUtcIsoWeek,
  toUtcDateString,
  utcMonthDateRange,
} from '../subscriptions/subscription.utils';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import {
  CompleteTaskDto,
  DriverTodayStatusFilter,
  SkipTaskDto,
} from './dto/task.dto';

export type DriverUiStatus =
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'skipped';

export type DriverTaskAddressView = {
  id: string;
  customerId: string;
  cityId: string;
  areaId: string;
  isActive: boolean;
  label: string;
  details: string;
  lat: number;
  lng: number;
};

export type DriverTaskView = {
  id: string;
  subscriptionId: string;
  customerId: string;
  driverId: string | null;
  areaId: string;
  scheduledDate: string;
  status: TaskStatus;
  photo: string | null;
  note: string | null;
  skipReason: string | null;
  skipLocation: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  skippedAt: Date | null;
  uiStatus: DriverUiStatus;
  street: string;
  areaName: string;
  binCode: string | null;
  instructions: string | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  addressId: string | null;
  address: DriverTaskAddressView | null;
  binId: string | null;
};

export type DriverTodayTaskCounts = {
  all: number;
  inProgress: number;
  completed: number;
  upcoming: number;
};

export type DriverPeriodStats = {
  total: number;
  completed: number;
  skipped: number;
  inProgress: number;
  upcoming: number;
};

export type DriverWeekDayCount = {
  /** 1=Mon .. 7=Sun (ISO) */
  day: number;
  /** Arabic weekday initial for chart axis */
  label: string;
  date: string;
  count: number;
};

export type DriverMonthOption = {
  year: number;
  month: number;
};

export type DriverMonthlyDashboard = DriverPeriodStats & {
  year: number;
  month: number;
  /** skipped alias for UI "فشل" */
  failed: number;
  completionRate: number;
  commitmentRate: number;
  /** Hours from startedAt→completedAt when both exist; else 0 */
  workHours: number;
  /** Not tracked yet */
  distanceKm: number | null;
  /** Not tracked yet */
  wasteTons: number | null;
  rating: number | null;
  weekDaily: DriverWeekDayCount[];
  achievement: {
    unlocked: boolean;
    title: string;
    message: string;
  } | null;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly driversService: DriversService,
    private readonly areasService: AreasService,
    private readonly customersService: CustomersService,
    private readonly binsService: BinsService,
    private readonly supportSettingsService: SupportSettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(): Promise<TaskDocument[]> {
    return this.taskModel.find().exec();
  }

  findById(id: string): Promise<TaskDocument | null> {
    return this.taskModel.findById(id).exec();
  }

  findByDriver(driverId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ driverId }).exec();
  }

  findByDriverOnDate(
    driverId: string,
    scheduledDate: string,
  ): Promise<TaskDocument[]> {
    return this.taskModel
      .find({ driverId, scheduledDate })
      .sort({ status: 1, scheduledDate: 1 })
      .exec();
  }

  findByDriverUpcoming(
    driverId: string,
    afterDate: string,
  ): Promise<TaskDocument[]> {
    return this.taskModel
      .find({ driverId, scheduledDate: { $gt: afterDate } })
      .sort({ scheduledDate: 1 })
      .exec();
  }

  findByCustomer(customerId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ customerId }).exec();
  }

  findBySubscription(subscriptionId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ subscriptionId }).exec();
  }

  /**
   * Cancels open (pending/assigned) tasks for a subscription when the plan is replaced.
   * Leaves completed, in-progress, and skipped tasks unchanged.
   */
  async cancelOpenForSubscription(subscriptionId: string): Promise<number> {
    const result = await this.taskModel
      .updateMany(
        {
          subscriptionId,
          status: { $in: [TaskStatus.Pending, TaskStatus.Assigned] },
        },
        { status: TaskStatus.Cancelled },
      )
      .exec();
    return result.modifiedCount;
  }

  countCompleted(): Promise<number> {
    return this.taskModel.countDocuments({ status: TaskStatus.Completed }).exec();
  }

  async countByDriver(
    driverId: string,
    options: {
      status?: TaskStatus | TaskStatus[];
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): Promise<number> {
    const filter: Record<string, unknown> = { driverId };
    if (options.status) {
      filter.status = Array.isArray(options.status)
        ? { $in: options.status }
        : options.status;
    }
    if (options.dateFrom || options.dateTo) {
      const scheduledDate: Record<string, string> = {};
      if (options.dateFrom) scheduledDate.$gte = options.dateFrom;
      if (options.dateTo) scheduledDate.$lte = options.dateTo;
      filter.scheduledDate = scheduledDate;
    }
    return this.taskModel.countDocuments(filter).exec();
  }

  async getDriverPeriodStats(
    driverId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<DriverPeriodStats> {
    const tasks = await this.taskModel
      .find({
        driverId,
        scheduledDate: { $gte: dateFrom, $lte: dateTo },
      })
      .select('status')
      .exec();

    const stats: DriverPeriodStats = {
      total: tasks.length,
      completed: 0,
      skipped: 0,
      inProgress: 0,
      upcoming: 0,
    };
    for (const task of tasks) {
      const ui = this.toUiStatus(task.status);
      if (ui === 'completed') stats.completed += 1;
      else if (ui === 'skipped') stats.skipped += 1;
      else if (ui === 'in_progress') stats.inProgress += 1;
      else stats.upcoming += 1;
    }
    return stats;
  }

  async listDriverActiveMonths(
    driverId: string,
  ): Promise<DriverMonthOption[]> {
    const dates = await this.taskModel
      .distinct('scheduledDate', { driverId })
      .exec();
    const seen = new Set<string>();
    const months: DriverMonthOption[] = [];
    for (const raw of dates as string[]) {
      const key = String(raw).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(key) || seen.has(key)) continue;
      seen.add(key);
      const [y, m] = key.split('-').map(Number);
      months.push({ year: y, month: m });
    }
    months.sort((a, b) =>
      a.year === b.year ? b.month - a.month : b.year - a.year,
    );

    const now = new Date();
    const cy = now.getUTCFullYear();
    const cm = now.getUTCMonth() + 1;
    if (!months.some((item) => item.year === cy && item.month === cm)) {
      months.unshift({ year: cy, month: cm });
    }
    return months;
  }

  async getDriverWeekDailyCounts(
    driverId: string,
  ): Promise<DriverWeekDayCount[]> {
    const labels = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];
    const start = startOfUtcIsoWeek();
    const days: DriverWeekDayCount[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = toUtcDateString(addDays(start, i));
      days.push({
        day: i + 1,
        label: labels[i],
        date,
        count: 0,
      });
    }
    const from = days[0].date;
    const to = days[6].date;
    const tasks = await this.taskModel
      .find({
        driverId,
        scheduledDate: { $gte: from, $lte: to },
      })
      .select('scheduledDate')
      .exec();
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const task of tasks) {
      const bucket = byDate.get(task.scheduledDate);
      if (bucket) bucket.count += 1;
    }
    return days;
  }

  async getDriverMonthlyDashboard(
    driverId: string,
    year: number,
    month: number,
    rating: number | null,
  ): Promise<DriverMonthlyDashboard> {
    const { from, to } = utcMonthDateRange(year, month);
    const tasks = await this.taskModel
      .find({
        driverId,
        scheduledDate: { $gte: from, $lte: to },
      })
      .select('status startedAt completedAt')
      .exec();

    const stats: DriverPeriodStats = {
      total: tasks.length,
      completed: 0,
      skipped: 0,
      inProgress: 0,
      upcoming: 0,
    };
    let workMs = 0;
    for (const task of tasks) {
      const ui = this.toUiStatus(task.status);
      if (ui === 'completed') {
        stats.completed += 1;
        if (task.startedAt && task.completedAt) {
          const ms =
            new Date(task.completedAt).getTime() -
            new Date(task.startedAt).getTime();
          if (ms > 0) workMs += ms;
        }
      } else if (ui === 'skipped') stats.skipped += 1;
      else if (ui === 'in_progress') stats.inProgress += 1;
      else stats.upcoming += 1;
    }

    const decided = stats.completed + stats.skipped;
    const completionRate =
      stats.total === 0
        ? 0
        : Math.round((stats.completed / stats.total) * 100);
    const commitmentRate =
      decided === 0 ? 0 : Math.round((stats.completed / decided) * 100);
    const workHours = Math.round((workMs / 3_600_000) * 10) / 10;

    const achievementUnlocked =
      stats.total >= 10 && completionRate >= 95;

    const weekDaily = await this.getDriverWeekDailyCounts(driverId);

    return {
      year,
      month,
      ...stats,
      failed: stats.skipped,
      completionRate,
      commitmentRate,
      workHours,
      distanceKm: null,
      wasteTons: null,
      rating,
      weekDaily,
      achievement: achievementUnlocked
        ? {
            unlocked: true,
            title: 'سائق متميز',
            message: 'حافظت على أداء استثنائي هذا الشهر. استمر!',
          }
        : {
            unlocked: false,
            title: 'سائق متميز',
            message: 'أكمل مهامك بنسبة إتمام 95% أو أعلى لنيل الشارة.',
          },
    };
  }

  toUiStatus(status: TaskStatus): DriverUiStatus {
    switch (status) {
      case TaskStatus.InProgress:
        return 'in_progress';
      case TaskStatus.Completed:
        return 'completed';
      case TaskStatus.Skipped:
      case TaskStatus.Cancelled:
        return 'skipped';
      case TaskStatus.Assigned:
      case TaskStatus.Pending:
      default:
        return 'upcoming';
    }
  }

  async enrichTask(task: TaskDocument): Promise<DriverTaskView> {
    const [area, subscription, timeWindow] = await Promise.all([
      this.areasService.findById(task.areaId),
      this.subscriptionsService.findById(task.subscriptionId),
      this.resolveTimeWindow(),
    ]);

    let street = '—';
    let instructions: string | null = null;
    let addressId: string | null = null;
    let addressView: DriverTaskAddressView | null = null;
    let binCode: string | null = null;
    let binId: string | null = null;

    if (subscription?.addressId) {
      addressId = String(subscription.addressId);
      const address = await this.customersService.findAddressById(addressId);
      if (address) {
        // Card title = address label (e.g. street); yellow note = details.
        street = address.label?.trim() || address.details?.trim() || '—';
        const details = address.details?.trim() || null;
        instructions =
          details && details !== street ? details : address.label?.trim() ? details : null;
        addressView = {
          id: String(address.id),
          customerId: String(address.customerId),
          cityId: String(address.cityId),
          areaId: String(address.areaId),
          isActive: Boolean(address.isActive),
          label: address.label ?? '',
          details: address.details ?? '',
          lat: address.lat,
          lng: address.lng,
        };
      }
    }

    if (subscription?.binId) {
      binId = String(subscription.binId);
      const bin = await this.binsService.findById(binId);
      binCode = bin?.code ?? null;
    }

    return {
      id: String(task.id),
      subscriptionId: task.subscriptionId,
      customerId: task.customerId,
      driverId: task.driverId,
      areaId: task.areaId,
      scheduledDate: task.scheduledDate,
      status: task.status,
      photo: task.photo,
      note: task.note,
      skipReason: task.skipReason,
      skipLocation: task.skipLocation,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      skippedAt: task.skippedAt,
      uiStatus: this.toUiStatus(task.status),
      street,
      areaName: area?.name ?? '—',
      binCode,
      instructions,
      timeWindowStart: timeWindow.startTime,
      timeWindowEnd: timeWindow.endTime,
      addressId,
      address: addressView,
      binId,
    };
  }

  async enrichTasks(tasks: TaskDocument[]): Promise<DriverTaskView[]> {
    return Promise.all(tasks.map((task) => this.enrichTask(task)));
  }

  countTodayByUiStatus(tasks: TaskDocument[]): DriverTodayTaskCounts {
    const counts: DriverTodayTaskCounts = {
      all: tasks.length,
      inProgress: 0,
      completed: 0,
      upcoming: 0,
    };
    for (const task of tasks) {
      const ui = this.toUiStatus(task.status);
      if (ui === 'in_progress') counts.inProgress += 1;
      else if (ui === 'completed') counts.completed += 1;
      else if (ui === 'upcoming') counts.upcoming += 1;
    }
    return counts;
  }

  filterByTodayStatus(
    tasks: TaskDocument[],
    status: DriverTodayStatusFilter = 'all',
  ): TaskDocument[] {
    if (status === 'all') {
      return tasks;
    }
    return tasks.filter((task) => this.toUiStatus(task.status) === status);
  }

  async getDriverTodaySchedule(
    driverId: string,
    status: DriverTodayStatusFilter = 'all',
  ): Promise<{ tasks: DriverTaskView[]; counts: DriverTodayTaskCounts }> {
    const today = this.todayDateString();
    const all = await this.findByDriverOnDate(driverId, today);
    const counts = this.countTodayByUiStatus(all);
    const filtered = this.filterByTodayStatus(all, status);
    // Stable card order: in_progress first, then upcoming, then completed/skipped
    const order: Record<DriverUiStatus, number> = {
      in_progress: 0,
      upcoming: 1,
      completed: 2,
      skipped: 3,
    };
    filtered.sort(
      (a, b) => order[this.toUiStatus(a.status)] - order[this.toUiStatus(b.status)],
    );
    return {
      tasks: await this.enrichTasks(filtered),
      counts,
    };
  }

  /**
   * Idempotently create one task per collection date for a subscription.
   * Skips dates that already have a task.
   */
  async createForSubscription(input: {
    subscriptionId: string;
    customerId: string;
    areaId: string;
    collectionDates: string[];
    driverId?: string | null;
  }): Promise<TaskDocument[]> {
    const created: TaskDocument[] = [];
    const hasDriver = Boolean(input.driverId);

    for (const scheduledDate of input.collectionDates) {
      const existing = await this.taskModel
        .findOne({
          subscriptionId: input.subscriptionId,
          scheduledDate,
        })
        .exec();
      if (existing) {
        created.push(existing);
        continue;
      }

      const task = await this.taskModel.create({
        subscriptionId: input.subscriptionId,
        customerId: input.customerId,
        areaId: input.areaId,
        scheduledDate,
        driverId: hasDriver ? input.driverId : null,
        status: hasDriver ? TaskStatus.Assigned : TaskStatus.Pending,
      });
      created.push(task);
    }

    return created;
  }

  /** Assign open tasks for a subscription to a driver (and create any missing). */
  async ensureAssignedToDriver(input: {
    subscriptionId: string;
    customerId: string;
    areaId: string;
    collectionDates: string[];
    driverId: string;
  }): Promise<TaskDocument[]> {
    await this.createForSubscription(input);

    await this.taskModel
      .updateMany(
        {
          subscriptionId: input.subscriptionId,
          status: { $in: [TaskStatus.Pending, TaskStatus.Assigned] },
        },
        { driverId: input.driverId, status: TaskStatus.Assigned },
      )
      .exec();

    return this.findBySubscription(input.subscriptionId);
  }

  async generate(date: string, areaId: string): Promise<TaskDocument[]> {
    const scheduledDate = date.slice(0, 10);
    const subscriptions =
      await this.subscriptionsService.findForGeneration(areaId, scheduledDate);
    const created = await Promise.all(
      subscriptions.map(async (subscription) => {
        const existing = await this.taskModel
          .findOne({
            subscriptionId: String(subscription.id),
            scheduledDate,
          })
          .exec();
        if (existing) {
          return existing;
        }

        const task = await this.taskModel.create({
          subscriptionId: String(subscription.id),
          customerId: subscription.customerId,
          areaId,
          scheduledDate,
          status: TaskStatus.Pending,
        });

        if (subscription.driverId) {
          return this.assign(String(task.id), subscription.driverId);
        }

        return task;
      }),
    );
    return created.filter((task): task is TaskDocument => task !== null);
  }

  async assign(id: string, driverId: string): Promise<TaskDocument | null> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      return null;
    }

    const driver = await this.driversService.findById(driverId);
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    if (driver.status !== 'active') {
      throw new BadRequestException('Driver is not active');
    }

    const area = await this.areasService.findById(task.areaId);
    if (!area) {
      throw new BadRequestException('Task area not found');
    }

    if (driver.areaId !== task.areaId || driver.cityId !== area.cityId) {
      throw new BadRequestException(
        'Driver must serve the same city and area as the task',
      );
    }

    const updated = await this.taskModel
      .findByIdAndUpdate(
        id,
        { driverId, status: TaskStatus.Assigned },
        { new: true },
      )
      .exec();

    if (updated && driver.userId) {
      void this.notificationsService
        .notifyFromTemplate(
          'TASK_ASSIGNED',
          [String(driver.userId)],
          { scheduledDate: String(updated.scheduledDate) },
          {
            referenceType: 'task',
            referenceId: String(updated.id),
            actionUrl: `/tasks/${updated.id}`,
          },
        )
        .catch(() => undefined);
    }

    return updated;
  }

  start(id: string): Promise<TaskDocument | null> {
    return this.updateWithTransition(id, {
      allowed: [TaskStatus.Assigned, TaskStatus.InProgress],
      action: 'start',
      update: { status: TaskStatus.InProgress, startedAt: new Date() },
    });
  }

  async complete(id: string, body: CompleteTaskDto): Promise<TaskDocument | null> {
    const updated = await this.updateWithTransition(id, {
      allowed: [TaskStatus.Assigned, TaskStatus.InProgress],
      action: 'complete',
      update: {
        status: TaskStatus.Completed,
        photo: body.photo ?? null,
        note: body.note ?? null,
        completedAt: new Date(),
      },
    });
    if (updated) {
      await this.notifyCustomerForTask(
        updated,
        'TASK_COMPLETED',
        { scheduledDate: String(updated.scheduledDate) },
      );
    }
    return updated;
  }

  async skip(id: string, body: SkipTaskDto): Promise<TaskDocument | null> {
    if (!body.reason || !body.location) {
      throw new BadRequestException('Report problem requires reason and location');
    }
    const updated = await this.updateWithTransition(id, {
      allowed: [TaskStatus.Assigned, TaskStatus.InProgress],
      action: 'report problem',
      update: {
        status: TaskStatus.Skipped,
        skipReason: body.reason,
        skipLocation: body.location,
        photo: body.photo ?? null,
        skippedAt: new Date(),
      },
    });
    if (updated) {
      await this.notifyCustomerForTask(updated, 'TASK_SKIPPED', {
        scheduledDate: String(updated.scheduledDate),
        reason: body.reason,
      });
    }
    return updated;
  }

  todayDateString(): string {
    return toUtcDateString(new Date());
  }

  private async notifyCustomerForTask(
    task: TaskDocument,
    code: string,
    variables: Record<string, string>,
  ) {
    const customer = await this.customersService.findById(String(task.customerId));
    if (!customer?.userId) return;
    void this.notificationsService
      .notifyFromTemplate(code, [String(customer.userId)], variables, {
        referenceType: 'task',
        referenceId: String(task.id),
        actionUrl: `/tasks/${task.id}`,
      })
      .catch(() => undefined);
  }

  private async resolveTimeWindow(): Promise<{
    startTime: string;
    endTime: string;
  }> {
    const settings = await this.supportSettingsService.getActive();
    const range = settings?.workingHours?.[0] ?? DEFAULT_WORKING_HOURS[0];
    return {
      startTime: range?.startTime ?? '07:00',
      endTime: range?.endTime ?? '11:00',
    };
  }

  private async updateWithTransition(
    id: string,
    options: {
      allowed: TaskStatus[];
      action: string;
      update: Record<string, unknown>;
    },
  ): Promise<TaskDocument | null> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      return null;
    }
    if (!options.allowed.includes(task.status)) {
      throw new BadRequestException(
        `Cannot ${options.action} task with status "${task.status}"`,
      );
    }
    return this.taskModel
      .findByIdAndUpdate(id, options.update, { new: true })
      .exec();
  }
}
